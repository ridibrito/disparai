import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";
import { DisparaiAPIClient } from '@/lib/disparai-api';

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔄 [SYNC] Iniciando sincronização de conversas do WhatsApp');

    // Buscar conexão ativa do usuário
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp_disparai')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ 
        error: 'Nenhuma conexão WhatsApp ativa encontrada' 
      }, { status: 400 });
    }

    console.log('✅ [SYNC] Conexão encontrada:', connection.instance_id);

    // Cliente da API Disparai
    const disparaiClient = new DisparaiAPIClient({
      instanceKey: connection.instance_id,
      apiToken: connection.api_key
    });

    // Buscar conversas/chats da instância
    try {
      const chatsResponse = await disparaiClient.getChats();
      
      if (chatsResponse.error) {
        console.log('❌ [SYNC] Erro ao buscar chats:', chatsResponse.message);
        return NextResponse.json({ 
          error: 'Erro ao buscar conversas do WhatsApp',
          details: chatsResponse.message 
        }, { status: 500 });
      }

      const chats = chatsResponse.data || [];
      console.log(`📱 [SYNC] Encontradas ${chats.length} conversas no WhatsApp`);

      let syncedCount = 0;
      let createdContacts = 0;
      let createdConversations = 0;

      // Processar cada conversa
      for (const chat of chats) {
        try {
          const phoneNumber = chat.id.replace('@c.us', '').replace('@g.us', '');
          
          // Buscar ou criar contato
          const contact = await findOrCreateContact(phoneNumber, user.id);
          
          if (contact) {
            if (contact.name === `Contato ${phoneNumber.slice(-4)}`) {
              createdContacts++;
            }
            
            // Buscar ou criar conversa
            const conversation = await findOrCreateConversation(contact.id, user.id);
            
            if (conversation) {
              if (conversation.created_at === conversation.updated_at) {
                createdConversations++;
              }
              
              // Buscar mensagens da conversa
              const messagesResponse = await disparaiClient.getMessages(chat.id);
              
              if (!messagesResponse.error && messagesResponse.data) {
                const messages = messagesResponse.data;
                console.log(`📨 [SYNC] Processando ${messages.length} mensagens para ${contact.name}`);
                
                // Salvar mensagens (apenas as que não existem)
                for (const message of messages) {
                  if (message.body && message.fromMe !== undefined) {
                    const { error: messageError } = await supabaseAdmin
                      .from('messages')
                      .upsert({
                        conversation_id: conversation.id,
                        sender: message.fromMe ? 'user' : 'contact',
                        content: message.body,
                        external_id: message.id,
                        status: 'received',
                        created_at: new Date(message.timestamp * 1000).toISOString()
                      }, {
                        onConflict: 'external_id'
                      });
                    
                    if (messageError) {
                      console.log('⚠️ [SYNC] Erro ao salvar mensagem:', messageError);
                    }
                  }
                }
              }
              
              syncedCount++;
            }
          }
        } catch (error) {
          console.log('⚠️ [SYNC] Erro ao processar conversa:', error);
        }
      }

      console.log(`✅ [SYNC] Sincronização concluída: ${syncedCount} conversas processadas`);

      return NextResponse.json({
        success: true,
        message: 'Sincronização concluída com sucesso',
        stats: {
          total_chats: chats.length,
          synced_conversations: syncedCount,
          created_contacts: createdContacts,
          created_conversations: createdConversations
        }
      });

    } catch (error: any) {
      console.error('❌ [SYNC] Erro na sincronização:', error);
      return NextResponse.json({ 
        error: 'Erro na sincronização',
        details: error.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro na API de sincronização:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// Função para buscar ou criar contato
async function findOrCreateContact(phoneNumber: string, userId: string) {
  try {
    // Limpar número de telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Buscar contato existente
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', cleanPhone)
      .single();
    
    if (existingContact) {
      return existingContact;
    }
    
    // Criar novo contato
    const { data: newContact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: userId,
        name: `Contato ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        organization_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [SYNC] Erro ao criar contato:', error);
      return null;
    }
    
    return newContact;
    
  } catch (error) {
    console.error('❌ [SYNC] Erro na função findOrCreateContact:', error);
    return null;
  }
}

// Função para buscar ou criar conversa
async function findOrCreateConversation(contactId: string, userId: string) {
  try {
    // Buscar conversa existente
    const { data: existingConversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .single();
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Criar nova conversa
    const { data: newConversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        contact_id: contactId,
        user_id: userId,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [SYNC] Erro ao criar conversa:', error);
      return null;
    }
    
    return newConversation;
    
  } catch (error) {
    console.error('❌ [SYNC] Erro na função findOrCreateConversation:', error);
    return null;
  }
}
