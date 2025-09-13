import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const instanceKey = body.instanceKey ?? body.instance_key ?? body.instance ?? body.key?.remoteJid?.split('@')[0] ?? "";

    if (!instanceKey) {
      console.log('⚠️ Webhook recebido sem instanceKey, tentando buscar instância ativa...');
      
      // Tentar buscar uma instância ativa como fallback
      const { data: activeInstance } = await supabase
        .from("whatsapp_instances")
        .select("instance_key")
        .eq("status", "ativo")
        .single();
      
      if (activeInstance) {
        console.log('✅ Usando instância ativa como fallback:', activeInstance.instance_key);
        const fallbackInstanceKey = activeInstance.instance_key;
        
        // Processar com a instância ativa
        return await processWebhookWithInstance(fallbackInstanceKey, body, supabase);
      } else {
        console.log('❌ Nenhuma instância ativa encontrada');
        return NextResponse.json({ ok: true, message: "Webhook recebido sem instanceKey e sem instância ativa" });
      }
    }

    console.log('📨 Webhook recebido:', { instanceKey, body });
    
    return await processWebhookWithInstance(instanceKey, body, supabase);
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

// Função para processar webhook com uma instância específica
async function processWebhookWithInstance(instanceKey: string, body: any, supabase: any) {
  try {
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
        let buttonId = null;
        
        if (body.messageType === 'extendedTextMessage' && body.message?.extendedTextMessage?.text) {
          messageText = body.message.extendedTextMessage.text;
        } else if (body.messageType === 'conversation' && body.message?.conversation) {
          messageText = body.message.conversation;
        } else if (body.messageType === 'interactive' && body.message?.interactive?.buttonReply) {
          // Processar resposta de botão
          messageText = body.message.interactive.buttonReply.title;
          buttonId = body.message.interactive.buttonReply.id;
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

          const { data: savedMessage, error: messageError } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender: 'contact',
              content: messageText,
              organization_id: instance.organization_id,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (messageError) {
            console.error('❌ Erro ao salvar mensagem:', messageError);
          } else {
            console.log('✅ Mensagem salva no banco de dados:', savedMessage.id);
            
            // Processar resposta de botão de confirmação
            if (buttonId === 'confirm_handoff' || buttonId === 'cancel_handoff') {
              console.log('🔘 Processando resposta de botão:', buttonId);
              
              try {
                const { processHandoffConfirmation } = await import('@/lib/ai');
                const confirmationText = buttonId === 'confirm_handoff' ? 'sim' : 'não';
                
                const confirmationResult = await processHandoffConfirmation(confirmationText);
                
                if (confirmationResult.handoff) {
                  // Transferir para humano
                  console.log('🔄 Transferindo conversa para humano...');
                  await supabase
                    .from('conversations')
                    .update({
                      status: 'human', // Usar coluna existente
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', conversationId);
                  
                  // Enviar mensagem de confirmação
                  try {
                    const { sendText } = await import('@/lib/whatsapp');
                    await sendText(
                      phoneNumber,
                      '✅ Perfeito! Sua conversa foi transferida para um atendente humano. Em breve você será atendido por um de nossos especialistas.',
                      instance.organization_id,
                      'whatsapp_disparai'
                    );
                    console.log('✅ Mensagem de confirmação de transferência enviada');
                  } catch (sendError) {
                    console.error('❌ Erro ao enviar mensagem de confirmação:', sendError);
                    // Salvar mensagem no banco mesmo se falhar o envio
                    try {
                      await supabase
                        .from('messages')
                        .insert({
                          conversation_id: conversationId,
                          sender: 'system',
                          content: '✅ Perfeito! Sua conversa foi transferida para um atendente humano. Em breve você será atendido por um de nossos especialistas.',
                          organization_id: instance.organization_id,
                          created_at: new Date().toISOString()
                        });
                      console.log('✅ Mensagem de confirmação salva no banco como fallback');
                    } catch (dbError) {
                      console.error('❌ Erro ao salvar mensagem no banco:', dbError);
                    }
                  }
                  
                  // Disparar notificação
                  console.log('🔔 Notificação: Conversa transferida para humano', {
                    conversationId,
                    contactPhone: phoneNumber
                  });
                } else {
                  // Continuar com IA
                  try {
                    const { sendText } = await import('@/lib/whatsapp');
                    await sendText(
                      phoneNumber,
                      confirmationResult.reply || 'Perfeito! Continuo aqui para te ajudar. Como posso te auxiliar?',
                      instance.organization_id,
                      'whatsapp_disparai'
                    );
                    console.log('✅ Mensagem de continuação com IA enviada');
                  } catch (sendError) {
                    console.error('❌ Erro ao enviar mensagem de continuação:', sendError);
                    // Salvar mensagem no banco mesmo se falhar o envio
                    try {
                      await supabase
                        .from('messages')
                        .insert({
                          conversation_id: conversationId,
                          sender: 'system',
                          content: confirmationResult.reply || 'Perfeito! Continuo aqui para te ajudar. Como posso te auxiliar?',
                          organization_id: instance.organization_id,
                          created_at: new Date().toISOString()
                        });
                      console.log('✅ Mensagem de continuação salva no banco como fallback');
                    } catch (dbError) {
                      console.error('❌ Erro ao salvar mensagem no banco:', dbError);
                    }
                  }
                }
              } catch (error) {
                console.error('❌ Erro ao processar confirmação de transferência:', error);
              }
            } 
            // Processar texto de confirmação (apenas se for confirmação, não pedido inicial)
            else if (/(sim|confirmo|quero|preciso|pode|pode ser|ok|tudo bem|perfeito|ótimo|exato|correto|isso mesmo)/i.test(messageText) && 
                     !/(atendente|humano|falar|pessoa|representante|operador|agente|especialista|consultor|vendedor|suporte|ajuda|não consigo|não entendo|complexo|difícil|urgente|emergência)/i.test(messageText)) {
              
              console.log('🔘 Processando confirmação de transferência via texto:', messageText);
              
              try {
                const { processHandoffConfirmation } = await import('@/lib/ai');
                const confirmationResult = await processHandoffConfirmation(messageText);
                
                if (confirmationResult.handoff) {
                  // Transferir para humano
                  console.log('🔄 Transferindo conversa para humano...');
                  await supabase
                    .from('conversations')
                    .update({
                      status: 'human', // Usar coluna existente
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', conversationId);
                  
                  // Enviar mensagem de confirmação
                  try {
                    const { sendText } = await import('@/lib/whatsapp');
                    await sendText(
                      phoneNumber,
                      '✅ Perfeito! Sua conversa foi transferida para um atendente humano. Em breve você será atendido por um de nossos especialistas.',
                      instance.organization_id,
                      'whatsapp_disparai'
                    );
                    console.log('✅ Mensagem de confirmação de transferência enviada');
                  } catch (sendError) {
                    console.error('❌ Erro ao enviar mensagem de confirmação:', sendError);
                    // Salvar mensagem no banco mesmo se falhar o envio
                    try {
                      await supabase
                        .from('messages')
                        .insert({
                          conversation_id: conversationId,
                          sender: 'system',
                          content: '✅ Perfeito! Sua conversa foi transferida para um atendente humano. Em breve você será atendido por um de nossos especialistas.',
                          organization_id: instance.organization_id,
                          created_at: new Date().toISOString()
                        });
                      console.log('✅ Mensagem de confirmação salva no banco como fallback');
                    } catch (dbError) {
                      console.error('❌ Erro ao salvar mensagem no banco:', dbError);
                    }
                  }
                  
                  // Disparar notificação
                  console.log('🔔 Notificação: Conversa transferida para humano', {
                    conversationId,
                    contactPhone: phoneNumber
                  });
                } else {
                  // Continuar com IA
                  try {
                    const { sendText } = await import('@/lib/whatsapp');
                    await sendText(
                      phoneNumber,
                      confirmationResult.reply || 'Perfeito! Continuo aqui para te ajudar. Como posso te auxiliar?',
                      instance.organization_id,
                      'whatsapp_disparai'
                    );
                    console.log('✅ Mensagem de continuação com IA enviada');
                  } catch (sendError) {
                    console.error('❌ Erro ao enviar mensagem de continuação:', sendError);
                    // Salvar mensagem no banco mesmo se falhar o envio
                    try {
                      await supabase
                        .from('messages')
                        .insert({
                          conversation_id: conversationId,
                          sender: 'system',
                          content: confirmationResult.reply || 'Perfeito! Continuo aqui para te ajudar. Como posso te auxiliar?',
                          organization_id: instance.organization_id,
                          created_at: new Date().toISOString()
                        });
                      console.log('✅ Mensagem de continuação salva no banco como fallback');
                    } catch (dbError) {
                      console.error('❌ Erro ao salvar mensagem no banco:', dbError);
                    }
                  }
                }
              } catch (error) {
                console.error('❌ Erro ao processar confirmação de transferência:', error);
              }
            } else {
              // Verificar se a conversa ainda está com IA antes de processar
              const { data: currentConversation } = await supabase
                .from('conversations')
                .select('status')
                .eq('id', conversationId)
                .single();

              if (currentConversation?.status === 'human') {
                console.log('🚫 Conversa já transferida para humano, IA não deve responder');
                return NextResponse.json({ success: true, message: 'Conversa em atendimento humano, IA não responde' });
              }

              // Processar resposta automática do agente de IA
              try {
                console.log('🤖 Iniciando processamento de resposta automática...');
                console.log('📞 Chamando API de processamento:', `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/process-response`);
                console.log('📝 Dados enviados:', { conversationId, messageId: savedMessage.id });
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/process-response`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    conversationId: conversationId,
                    messageId: savedMessage.id
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ Resposta automática processada:', result);
                } else {
                  console.error('❌ Erro ao processar resposta automática:', response.status);
                }
              } catch (error) {
                console.error('❌ Erro ao chamar API de resposta automática:', error);
              }
            }
          }
        }
      }
    }

    console.log('✅ Webhook processado com sucesso:', { instanceKey, connected });

    return NextResponse.json({ ok: true, connected });
  } catch (error) {
    console.error('❌ Erro no processamento do webhook:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
