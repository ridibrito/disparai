import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { instanceId: string } }) {
  const instanceId = params.instanceId;
  
  console.log(`🔍 [WEBHOOK] GET request para instância ${instanceId} em ${new Date().toISOString()}`);
  
  return NextResponse.json({
    success: true,
    message: "Webhook está funcionando",
    instanceId: instanceId,
    timestamp: new Date().toISOString(),
    webhook_url: `http://localhost:3000/api/webhooks/whatsapp/${instanceId}`,
    instructions: {
      step1: "Este webhook está funcionando corretamente",
      step2: "Configure esta URL no painel da MegaAPI",
      step3: "Envie uma mensagem para o número conectado",
      step4: "A mensagem aparecerá automaticamente na interface"
    }
  });
}

export async function POST(req: Request, { params }: { params: { instanceId: string } }) {
  const startTime = Date.now();
  
  try {
    const instanceId = params.instanceId;
    
    // Log de qualquer tentativa de acesso
    console.log(`🚨 [WEBHOOK] Tentativa de acesso para instância ${instanceId} em ${new Date().toISOString()}`);
    console.log(`📋 [WEBHOOK] Headers:`, Object.fromEntries(req.headers.entries()));
    console.log(`🌐 [WEBHOOK] URL:`, req.url);
    console.log(`🔗 [WEBHOOK] Method:`, req.method);
    
    const body = await req.json();
    
    console.log(`📨 [WEBHOOK] Body recebido:`, body);

    const { instanceKey, event, data } = body;

    if (!instanceKey) {
      console.error('❌ [WEBHOOK] instanceKey não fornecido no webhook');
      return NextResponse.json({ error: 'instanceKey é obrigatório' }, { status: 400 });
    }

    console.log(`🔍 [WEBHOOK] Processando evento '${event}' para instância '${instanceKey}'`);

    // Verificar se a instância existe
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('instance_id', instanceKey)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      console.error(`❌ Instância ${instanceKey} não encontrada:`, connectionError);
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
    }

    console.log(`✅ Instância ${instanceKey} validada para usuário ${connection.user_id}`);

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'connection':
      case 'status':
        await handleConnectionStatus(instanceKey, data, connection);
        break;
      
      case 'message':
        await handleMessage(instanceKey, data, connection);
        break;
      
      case 'delivery':
        await handleDelivery(instanceKey, data, connection);
        break;
      
      default:
        console.log(`ℹ️ Evento não processado: ${event}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ [WEBHOOK] Processado com sucesso em ${processingTime}ms para instância ${instanceKey}`);
    
    return NextResponse.json({ 
      success: true,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [WEBHOOK] Erro ao processar webhook em ${processingTime}ms:`, {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      instanceId: params.instanceId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleConnectionStatus(instanceKey: string, data: any, connection: any) {
  try {
    console.log(`🔗 Processando status de conexão para ${instanceKey}`);
    
    // Mapear status do MegaAPI para nosso sistema
    let mappedStatus = 'pendente';
    if (data?.status === 'connected') {
      mappedStatus = 'ativo';
    } else if (data?.status === 'disconnected') {
      mappedStatus = 'desconectado';
    }

    // Atualizar status na conexão
    const { error: updateError } = await supabaseAdmin
      .from('api_connections')
      .update({ 
        status: mappedStatus === 'ativo' ? 'active' : 'disconnected',
        is_active: mappedStatus === 'ativo',
        updated_at: new Date().toISOString() 
      })
      .eq('instance_id', instanceKey);

    if (updateError) {
      console.error('❌ Erro ao atualizar status da conexão:', updateError);
      return;
    }

    console.log(`✅ Status da conexão ${instanceKey} atualizado para: ${mappedStatus}`);

  } catch (error) {
    console.error('❌ Erro ao processar status de conexão:', error);
  }
}

async function handleMessage(instanceKey: string, data: any, connection: any) {
  try {
    console.log(`📱 Processando mensagem para ${instanceKey}:`, data);

    // Extrair dados da mensagem
    const { from, body: messageBody, type: messageType, timestamp, messageId } = data;
    
    if (!from || !messageBody) {
      console.log('❌ [WEBHOOK] Dados da mensagem incompletos');
      return;
    }

    console.log(`📨 Mensagem recebida de ${from}: ${messageBody}`);

    // Buscar ou criar contato
    const cleanPhone = from.replace(/\D/g, '');
    
    let contact = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', connection.user_id)
      .eq('phone', cleanPhone)
      .single();

    if (!contact.data) {
      // Criar novo contato
      console.log('👤 [WEBHOOK] Criando novo contato para:', cleanPhone);
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .insert({
          user_id: connection.user_id,
          name: `Contato ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          organization_id: connection.user_id
        })
        .select()
        .single();

      if (contactError) {
        console.log('❌ [WEBHOOK] Erro ao criar contato:', contactError);
        return;
      }

      contact = { data: newContact };
    }

    // Buscar ou criar conversa
    let conversation = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.data.id)
      .eq('user_id', connection.user_id)
      .single();

    if (!conversation.data) {
      // Criar nova conversa
      console.log('🆕 [WEBHOOK] Criando nova conversa para contato:', contact.data.id);
      const { data: newConversation, error: conversationError } = await supabaseAdmin
        .from('conversations')
        .insert({
          contact_id: contact.data.id,
          user_id: connection.user_id,
          organization_id: connection.user_id,
          status: 'active'
        })
        .select()
        .single();

      if (conversationError) {
        console.log('❌ [WEBHOOK] Erro ao criar conversa:', conversationError);
        return;
      }

      conversation = { data: newConversation };
    }

    // Salvar mensagem
    const { data: savedMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.data.id,
        sender: 'contact',
        content: messageBody,
        organization_id: connection.user_id,
        created_at: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.log('❌ [WEBHOOK] Erro ao salvar mensagem:', messageError);
      return;
    }

    // Atualizar updated_at da conversa
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.data.id);

    console.log('✅ [WEBHOOK] Mensagem processada com sucesso:', savedMessage.id);
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

async function handleDelivery(instanceKey: string, data: any, connection: any) {
  try {
    console.log(`📤 Processando status de entrega para ${instanceKey}:`, data);
    
    // Aqui você pode processar status de entrega de mensagens
    // Por exemplo, atualizar status de mensagens enviadas
    
  } catch (error) {
    console.error('❌ Erro ao processar status de entrega:', error);
  }
}
