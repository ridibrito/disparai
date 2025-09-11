import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 WEBHOOK CHAMADO - TIMESTAMP:', new Date().toISOString());
    console.log('🔔 URL:', request.url);
    console.log('🔔 Method:', request.method);
    console.log('🔔 Headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('📦 Dados do webhook:', JSON.stringify(body, null, 2));
    console.log('🔍 Estrutura do body:', {
      hasType: 'type' in body,
      hasMessage: 'message' in body,
      hasInstance: 'instance' in body,
      hasInstanceKey: 'instance_key' in body,
      hasData: 'data' in body,
      keys: Object.keys(body)
    });
    
    const supabase = createServerClientWithServiceRole();
    
    // Verificar diferentes formatos de mensagem da MegaAPI
    let messageData = null;
    let instanceKey = null;
    
    // Formato 1: body.type === 'message' && body.message
    if (body.type === 'message' && body.message) {
      messageData = body.message;
      instanceKey = body.instance || body.instance_key;
      console.log('📨 Formato 1 detectado - mensagem simples');
    }
    // Formato 2: body.data (formato Disparai/MegaAPI)
    else if (body.data && body.data.message) {
      messageData = body.data.message;
      instanceKey = body.instance || body.instance_key;
      console.log('📨 Formato 2 detectado - mensagem com data');
    }
    // Formato 3: mensagem direta no body
    else if (body.message) {
      messageData = body.message;
      instanceKey = body.instance || body.instance_key;
      console.log('📨 Formato 3 detectado - mensagem direta');
    }
    
    if (messageData && instanceKey) {
      // Extrair informações da mensagem baseado no formato
      let from = null;
      let messageContent = '';
      let messageType = 'text';
      
      // Formato 1: messageData.text, messageData.caption, etc.
      if (messageData.text) {
        messageContent = messageData.text;
        from = body.from || messageData.from;
      } else if (messageData.caption) {
        messageContent = messageData.caption;
        from = body.from || messageData.from;
      } else if (messageData.conversation) {
        messageContent = messageData.conversation;
        from = body.from || messageData.from;
      }
      
      console.log(`📨 Mensagem recebida de ${from}: ${messageContent || '[mídia]'}`);
      
      // Buscar instância WhatsApp
      console.log('🔍 Buscando instância:', instanceKey);
      const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('organization_id, instance_key')
        .eq('instance_key', instanceKey)
        .single();

      console.log('🔍 Resultado da busca:', { instanceData, instanceError });

      if (instanceError || !instanceData) {
        console.error('❌ Instância não encontrada:', instanceKey);
        console.error('❌ Erro detalhado:', instanceError);
        return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
      }

      // Buscar contato pelo telefone
      let { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .limit(1)
        .single();

      if (contactError || !contact) {
        console.log(`⚠️ Contato não encontrado para ${from}, criando automaticamente...`);
        
        // Criar contato automaticamente
        const { data: newContact, error: createContactError } = await supabase
          .from('contacts')
          .insert({})
          .select()
          .single();

        if (createContactError || !newContact) {
          console.error('❌ Erro ao criar contato:', createContactError);
          return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 });
        }

        contact = newContact;
      }

      // Buscar user_id da organização
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', instanceData.organization_id)
        .single();

      if (userError || !userData) {
        console.error('❌ Erro ao buscar usuário da organização:', userError);
        return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
      }

      // Buscar ou criar conversa
      let { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('user_id', userData.id)
        .single();

      if (conversationError || !conversation) {
        console.log('📝 Criando nova conversa...');
        
        const { data: newConversation, error: createConversationError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            user_id: userData.id,
            organization_id: instanceData.organization_id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createConversationError || !newConversation) {
          console.error('❌ Erro ao criar conversa:', createConversationError);
          return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
        }

        conversation = newConversation;
      }

      // Determinar tipo e conteúdo da mensagem
      let finalMessageContent = messageContent;
      let finalMessageType = messageType;
      let mediaUrl = null;

      if (messageData.image) {
        finalMessageContent = messageData.caption || '[Imagem]';
        finalMessageType = 'image';
        mediaUrl = messageData.image.url || messageData.image;
      } else if (messageData.document) {
        finalMessageContent = messageData.caption || '[Documento]';
        finalMessageType = 'document';
        mediaUrl = messageData.document.url || messageData.document;
      } else if (messageData.audio) {
        finalMessageContent = '[Áudio]';
        finalMessageType = 'audio';
        mediaUrl = messageData.audio.url || messageData.audio;
      } else if (messageData.video) {
        finalMessageContent = messageData.caption || '[Vídeo]';
        finalMessageType = 'video';
        mediaUrl = messageData.video.url || messageData.video;
      } else if (!finalMessageContent) {
        finalMessageContent = '[Mensagem não suportada]';
      }

      // Salvar mensagem no banco
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          organization_id: instanceData.organization_id,
          sender: 'contact',
          content: finalMessageContent,
          media_url: mediaUrl
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Erro ao salvar mensagem:', messageError);
        return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
      }

      // Atualizar última mensagem da conversa
      await supabase
        .from('conversations')
        .update({
          last_message_content: finalMessageContent,
          last_message_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      console.log('✅ Mensagem salva com sucesso:', newMessage.id);
      
      return NextResponse.json({ 
        success: true, 
        messageId: newMessage.id,
        conversationId: conversation.id
      });
    }

    // Verificar se é status de entrega/leitura
    if (body.type === 'delivery' || body.type === 'read') {
      const { messageId, status } = body;
      
      console.log(`📬 Status de entrega: ${status} para mensagem ${messageId}`);
      
      // Atualizar status da mensagem no banco
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: status === 'delivered' ? 'delivered' : 'read',
          updated_at: new Date().toISOString()
        })
        .eq('external_id', messageId);

      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
      }

      console.log('✅ Status atualizado com sucesso');
      return NextResponse.json({ success: true });
    }

    console.log('⚠️ Webhook recebido, mas formato não reconhecido ou dados incompletos');
    console.log('📋 Dados recebidos:', {
      hasMessageData: !!messageData,
      hasInstanceKey: !!instanceKey,
      bodyKeys: Object.keys(body),
      bodyType: typeof body
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook recebido, mas formato não reconhecido',
      debug: {
        hasMessageData: !!messageData,
        hasInstanceKey: !!instanceKey,
        bodyKeys: Object.keys(body)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook de mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
