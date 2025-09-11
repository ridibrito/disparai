import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para buscar ou criar contato
async function findOrCreateContact(phoneNumber: string, userId: string) {
  try {
    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Buscar contato existente
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', cleanPhone)
      .single();
    
    if (existingContact) {
      console.log('📞 [WEBHOOK] Contato existente encontrado:', existingContact.name);
      return existingContact;
    }
    
    // Criar novo contato
    console.log('👤 [WEBHOOK] Criando novo contato para:', cleanPhone);
    const { data: newContact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: userId,
        name: `Contato ${cleanPhone.slice(-4)}`, // Nome temporário
        phone: cleanPhone,
        organization_id: userId // Usando userId como organization_id temporariamente
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [WEBHOOK] Erro ao criar contato:', error);
      return null;
    }
    
    console.log('✅ [WEBHOOK] Novo contato criado:', newContact.id);
    return newContact;
    
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro na função findOrCreateContact:', error);
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
      console.log('💬 [WEBHOOK] Conversa existente encontrada:', existingConversation.id);
      return existingConversation;
    }
    
  // Criar nova conversa
  console.log('🆕 [WEBHOOK] Criando nova conversa para contato:', contactId);
  const { data: newConversation, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      contact_id: contactId,
      user_id: userId,
      organization_id: userId, // Usando userId como organization_id temporariamente
      status: 'active'
    })
    .select()
    .single();
    
    if (error) {
      console.error('❌ [WEBHOOK] Erro ao criar conversa:', error);
      return null;
    }
    
    console.log('✅ [WEBHOOK] Nova conversa criada:', newConversation.id);
    return newConversation;
    
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro na função findOrCreateConversation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook recebido do WhatsApp');
    
    const body = await request.json();
    console.log('📦 Dados do webhook:', JSON.stringify(body, null, 2));
    
    // Verificar se é uma mensagem recebida
    if (body.type === 'message' && body.message) {
      const { from, body: messageBody, type: messageType, timestamp } = body.message;
      
      console.log(`📨 Mensagem recebida de ${from}: ${messageBody} (tipo: ${messageType})`);
      
      // Buscar a conexão da instância
      console.log('🔍 [WEBHOOK] Buscando conexão para instância:', body.instance);
      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('type', 'whatsapp_disparai')
        .eq('instance_id', body.instance || 'disparai')
        .single();
      
      if (connectionError) {
        console.log('❌ [WEBHOOK] Erro ao buscar conexão:', connectionError);
        return NextResponse.json({ 
          error: 'Conexão não encontrada',
          details: connectionError.message 
        }, { status: 404 });
      }
      
      if (!connection) {
        console.log('❌ [WEBHOOK] Nenhuma conexão encontrada para instância:', body.instance);
        return NextResponse.json({ 
          error: 'Conexão não encontrada' 
        }, { status: 404 });
      }
      
      if (connection) {
        console.log('🔍 [WEBHOOK] Processando mensagem para usuário:', connection.user_id);
        
        // Buscar ou criar contato
        console.log('🔍 [WEBHOOK] Buscando/criando contato para:', from);
        let contact = await findOrCreateContact(from, connection.user_id);
        
        if (contact) {
          console.log('✅ [WEBHOOK] Contato encontrado/criado:', contact.id, contact.name);
          
          // Buscar ou criar conversa
          console.log('🔍 [WEBHOOK] Buscando/criando conversa para contato:', contact.id);
          let conversation = await findOrCreateConversation(contact.id, connection.user_id);
          
          if (conversation) {
            console.log('✅ [WEBHOOK] Conversa encontrada/criada:', conversation.id);
            
            // Salvar mensagem na conversa
            const { data: savedMessage, error: messageError } = await supabaseAdmin
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                sender: 'contact',
                content: messageBody,
                organization_id: connection.user_id,
                created_at: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString()
              })
              .select()
              .single();
            
            if (messageError) {
              console.error('❌ [WEBHOOK] Erro ao salvar mensagem:', messageError);
            } else {
              console.log('✅ [WEBHOOK] Mensagem salva:', savedMessage.id);
              
              // Atualizar updated_at da conversa
              await supabaseAdmin
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversation.id);
            }
          } else {
            console.log('❌ [WEBHOOK] Erro ao criar/buscar conversa para contato:', contact.id);
          }
        } else {
          console.log('❌ [WEBHOOK] Erro ao criar/buscar contato para:', from);
        }
      }
    }
    
    // Verificar se é status de conexão
    if (body.type === 'connection' || body.type === 'status') {
      console.log(`🔌 Status da conexão: ${body.status || body.connection}`);
      
      // Atualizar status da conexão no banco
      const supabaseClient = supabase;
      
      const { error } = await supabaseClient
        .from('api_connections')
        .update({ 
          status: body.status === 'connected' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('type', 'whatsapp_disparai')
        .eq('instance_id', body.instance || 'disparai');
      
      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
      } else {
        console.log('✅ Status atualizado no banco de dados');
      }
    }
    
    // Verificar se é status de entrega
    if (body.type === 'delivery' || body.type === 'read') {
      console.log(`📬 Status de entrega: ${body.status} para ${body.to}`);
      
      // Atualizar status da mensagem no banco
      const supabaseClient = supabase;
      
      const { error } = await supabaseClient
        .from('messages')
        .update({ 
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('to_number', body.to)
        .eq('message_id', body.messageId)
        .eq('direction', 'outbound');
      
      if (error) {
        console.error('❌ Erro ao atualizar status de entrega:', error);
      } else {
        console.log('✅ Status de entrega atualizado');
      }
    }
    
    // Responder com sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Endpoint para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint funcionando!',
    timestamp: new Date().toISOString()
  });
}
