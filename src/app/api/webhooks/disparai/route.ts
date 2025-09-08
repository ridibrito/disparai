import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    // Verificar se é uma mensagem recebida
    if (body.event === 'messages.upsert' && body.data) {
      const messageData = body.data;
      
      // Verificar se é uma mensagem de texto recebida (não enviada por nós)
      if (messageData.messageType === 'conversation' && 
          messageData.key.fromMe === false) {
        
        await processReceivedMessage(messageData);
      }
    }

    // Verificar se é um status de entrega
    if (body.event === 'messages.update' && body.data) {
      const updateData = body.data;
      
      if (updateData.update.status) {
        await updateMessageStatus(updateData);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function processReceivedMessage(messageData: any) {
  const supabase = await createServerClient();
  
  try {
    const phoneNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const messageText = messageData.message?.conversation || 
                       messageData.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    // Buscar ou criar contato
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('phone', phoneNumber)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Erro ao buscar contato:', contactError);
      return;
    }

    let contactId = contact?.id;
    let userId = contact?.user_id;

    // Se contato não existe, criar um novo
    if (!contact) {
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          name: phoneNumber, // Nome padrão será o telefone
          phone: phoneNumber,
          user_id: null, // Será atualizado quando associarmos a uma instância
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Erro ao criar contato:', createError);
        return;
      }

      contactId = newContact.id;
    }

    // Buscar a instância que recebeu a mensagem
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('user_id, instance_id')
      .eq('instance_id', messageData.key.remoteJid.split('@')[0])
      .eq('type', 'whatsapp_disparai')
      .single();

    if (connectionError) {
      console.error('Erro ao buscar conexão:', connectionError);
      return;
    }

    // Atualizar user_id do contato se necessário
    if (contact && !contact.user_id && connection.user_id) {
      await supabase
        .from('contacts')
        .update({ user_id: connection.user_id })
        .eq('id', contactId);
      
      userId = connection.user_id;
    }

    // Buscar ou criar conversa
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    let conversationId = conversation?.id;

    if (!conversation) {
      const { data: newConversation, error: createConvError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contactId,
          user_id: userId,
          status: 'active',
        })
        .select('id')
        .single();

      if (createConvError) {
        console.error('Erro ao criar conversa:', createConvError);
        return;
      }

      conversationId = newConversation.id;
    }

    // Salvar mensagem
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'contact',
        content: messageText,
        external_id: messageData.key.id,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    }

    console.log('Mensagem processada com sucesso:', {
      contactId,
      conversationId,
      messageText: messageText.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error);
  }
}

async function updateMessageStatus(updateData: any) {
  const supabase = await createServerClient();
  
  try {
    const messageId = updateData.key.id;
    const status = updateData.update.status;
    
    // Mapear status do WhatsApp para nosso sistema
    let mappedStatus = 'sent';
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (status) {
      case 'delivered':
        mappedStatus = 'delivered';
        updateData.delivered_at = new Date().toISOString();
        break;
      case 'read':
        mappedStatus = 'read';
        updateData.read_at = new Date().toISOString();
        break;
      case 'failed':
        mappedStatus = 'failed';
        updateData.error_message = 'Falha no envio via WhatsApp';
        break;
    }

    updateData.status = mappedStatus;

    // Atualizar status na tabela campaign_messages
    const { error } = await supabase
      .from('campaign_messages')
      .update(updateData)
      .eq('whatsapp_message_id', messageId);

    if (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
    }

    console.log('Status da mensagem atualizado:', { messageId, status: mappedStatus });

  } catch (error) {
    console.error('Erro ao atualizar status da mensagem:', error);
  }
}

// GET para verificação de webhook
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get('hub.challenge');
  
  if (challenge) {
    return new NextResponse(challenge);
  }
  
  return NextResponse.json({ message: 'Webhook endpoint ativo' });
}
