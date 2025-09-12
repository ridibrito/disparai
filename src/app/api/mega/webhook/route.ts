import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const instanceKey = body.instanceKey ?? body.instance_key ?? body.instance ?? "";

    if (!instanceKey) {
      console.log('⚠️ Webhook recebido sem instanceKey');
      return NextResponse.json({ ok: true, message: "Webhook recebido sem instanceKey" });
    }

    console.log('📨 Webhook recebido:', { instanceKey, body });

    // Re-verificar status na MegaAPI
    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    const r = await fetch(`${host}/rest/instance/${instanceKey}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!r.ok) {
      console.error('❌ Erro ao verificar status no webhook:', r.status);
      return NextResponse.json({ ok: false, error: "Erro ao verificar status" }, { status: r.status });
    }

    const statusData = await r.json();
    const connected = !!(statusData?.instance?.user || statusData?.instance?.status === 'connected');

    console.log('🔍 Status verificado:', { instanceKey, connected, statusData });

    // Atualizar whatsapp_instances
    const { error: instanceError } = await supabase
      .from("whatsapp_instances")
      .update({ 
        status: connected ? "ativo" : "desconectado", 
        updated_at: new Date().toISOString() 
      })
      .eq("instance_key", instanceKey);

    if (instanceError) {
      console.error('❌ Erro ao atualizar whatsapp_instances:', instanceError);
    }

    // Atualizar api_connections
    const { error: connectionError } = await supabase
      .from("api_connections")
      .update({
        is_active: connected,
        status: connected ? "active" : "inactive",
        updated_at: new Date().toISOString()
      })
      .eq("instance_id", instanceKey);

    if (connectionError) {
      console.error('❌ Erro ao atualizar api_connections:', connectionError);
    }

    // Processar mensagem se for do tipo message
    if (body.messageType && body.key && body.key.fromMe === false) {
      console.log('📨 Processando mensagem recebida:', {
        from: body.key.remoteJid,
        messageType: body.messageType,
        pushName: body.pushName
      });

      // Buscar a instância no banco
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("instance_key", instanceKey)
        .single();

      if (instance) {
        // Extrair texto da mensagem baseado no tipo
        let messageText = '';
        if (body.messageType === 'extendedTextMessage' && body.message?.extendedTextMessage?.text) {
          messageText = body.message.extendedTextMessage.text;
        } else if (body.messageType === 'conversation' && body.message?.conversation) {
          messageText = body.message.conversation;
        } else {
          messageText = `[${body.messageType}]`;
        }

        // Buscar ou criar contato
        const phoneNumber = body.key.remoteJid.replace('@s.whatsapp.net', '');
        const { data: existingContact, error: contactError } = await supabase
          .from("contacts")
          .select("*")
          .eq("phone", phoneNumber)
          .eq("user_id", instance.organization_id)
          .single();

        let contactId = existingContact?.id;

        if (!existingContact || contactError) {
          // Criar novo contato
          const { data: newContact, error: createContactError } = await supabase
            .from("contacts")
            .insert({
              user_id: instance.organization_id,
              name: body.pushName || `Contato ${phoneNumber.slice(-4)}`,
              phone: phoneNumber,
              organization_id: instance.organization_id
            })
            .select()
            .single();

          if (createContactError) {
            console.error('❌ Erro ao criar contato:', createContactError);
          } else {
            contactId = newContact.id;
            console.log('✅ Novo contato criado:', contactId);
          }
        }

        // Buscar ou criar conversa
        let conversationId = null;
        if (contactId) {
          const { data: conversation, error: conversationError } = await supabase
            .from("conversations")
            .select("*")
            .eq("contact_id", contactId)
            .single();

          conversationId = conversation?.id;

          if (!conversation || conversationError) {
            // Criar nova conversa
            const { data: newConversation, error: createConvError } = await supabase
              .from("conversations")
              .insert({
                contact_id: contactId,
                user_id: instance.organization_id,
                organization_id: instance.organization_id,
                status: 'ai',
                start_time: new Date().toISOString()
              })
              .select()
              .single();

            if (createConvError) {
              console.error('❌ Erro ao criar conversa:', createConvError);
            } else {
              conversationId = newConversation.id;
              console.log('✅ Nova conversa criada:', conversationId);
            }
          }
        }

        // Salvar mensagem recebida (verificar duplicatas primeiro)
        if (conversationId) {
          // Verificar se a mensagem já existe (usando ID único do WhatsApp)
          const messageId = body.key.id;
          const { data: existingMessage } = await supabase
            .from("messages")
            .select("id")
            .eq("conversation_id", conversationId)
            .eq("content", messageText)
            .eq("sender", 'contact')
            .gte("created_at", new Date(Date.now() - 60000).toISOString()) // 1 minuto de tolerância
            .single();

          if (existingMessage) {
            console.log('⏭️ Mensagem já existe, pulando duplicata:', messageId);
            return NextResponse.json({ success: true, message: 'Mensagem duplicada ignorada' });
          }

          const { error: messageError } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender: 'contact',
              content: messageText,
              organization_id: instance.organization_id,
              created_at: new Date().toISOString()
            });

          if (messageError) {
            console.error('❌ Erro ao salvar mensagem:', messageError);
          } else {
            console.log('✅ Mensagem salva no banco de dados');
          }
        }
      }
    }

    console.log('✅ Webhook processado com sucesso:', { instanceKey, connected });

    return NextResponse.json({ ok: true, connected });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// Função para processar atualizações de status de mensagem
async function handleMessageStatusUpdate(body: any, instance: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { messageId, status } = body;
    
    console.log('📊 Processando atualização de status:', { messageId, status });

    // Atualizar status da mensagem no banco
    const { error: updateError } = await supabase
      .from('messages')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('❌ Erro ao atualizar status da mensagem:', updateError);
    } else {
      console.log('✅ Status da mensagem atualizado:', { messageId, status });
    }

  } catch (error) {
    console.error('❌ Erro ao processar atualização de status:', error);
  }
}
