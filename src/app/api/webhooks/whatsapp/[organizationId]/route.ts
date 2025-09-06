import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request, { params }: { params: { organizationId: string } }) {
  try {
    const organizationId = params.organizationId;
    const body = await req.json();
    
    console.log(`📨 Webhook recebido para organização ${organizationId}:`, body);

    const { instanceKey, event, data } = body;

    if (!instanceKey) {
      console.error('❌ instanceKey não fornecido no webhook');
      return NextResponse.json({ error: 'instanceKey é obrigatório' }, { status: 400 });
    }

    // Verificar se a instância pertence à organização correta
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', instanceKey)
      .eq('organization_id', organizationId)
      .single();

    if (instanceError || !instance) {
      console.error(`❌ Instância ${instanceKey} não encontrada para organização ${organizationId}:`, instanceError);
      return NextResponse.json({ error: 'Instância não encontrada ou não pertence à organização' }, { status: 404 });
    }

    console.log(`✅ Instância ${instanceKey} validada para organização ${organizationId}`);

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'connection':
      case 'status':
        await handleConnectionStatus(instanceKey, data, organizationId);
        break;
      
      case 'message':
        await handleMessage(instanceKey, data, organizationId);
        break;
      
      case 'delivery':
        await handleDelivery(instanceKey, data, organizationId);
        break;
      
      default:
        console.log(`ℹ️ Evento não processado: ${event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

async function handleConnectionStatus(instanceKey: string, data: any, organizationId: string) {
  try {
    console.log(`🔗 Processando status de conexão para ${instanceKey}`);
    
    // Mapear status do MegaAPI para nosso sistema
    let mappedStatus = 'pendente';
    if (data?.status === 'connected') {
      mappedStatus = 'ativo';
    } else if (data?.status === 'disconnected') {
      mappedStatus = 'desconectado';
    }

    // Atualizar status na tabela whatsapp_instances
    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({ 
        status: mappedStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('instance_key', instanceKey)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('❌ Erro ao atualizar status da instância:', updateError);
      return;
    }

    console.log(`✅ Status da instância ${instanceKey} atualizado para: ${mappedStatus}`);

    // Se conectou, ativar conexão na api_connections
    if (mappedStatus === 'ativo') {
      const { data: existingConnection } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('instance_id', instanceKey)
        .eq('organization_id', organizationId)
        .single();

      if (existingConnection) {
        // Atualizar conexão existente
        const { error: connectionUpdateError } = await supabaseAdmin
          .from('api_connections')
          .update({
            status: 'active',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('instance_id', instanceKey)
          .eq('organization_id', organizationId);

        if (connectionUpdateError) {
          console.error('❌ Erro ao ativar conexão:', connectionUpdateError);
        } else {
          console.log('✅ Conexão ativada na api_connections');
        }
      } else {
        // Criar nova conexão se não existir
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('organization_id', organizationId)
          .single();

        if (user) {
          const connectionData = {
            user_id: user.id,
            organization_id: organizationId,
            name: `WhatsApp Disparai - ${instanceKey}`,
            type: 'whatsapp_disparai',
            instance_id: instanceKey,
            api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            api_secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            status: 'active',
            is_active: true,
            provider: 'disparai'
          };

          const { error: connectionError } = await supabaseAdmin
            .from('api_connections')
            .insert(connectionData as any);

          if (connectionError) {
            console.error('❌ Erro ao criar conexão:', connectionError);
          } else {
            console.log('✅ Conexão criada automaticamente');
          }
        }
      }
    } else if (mappedStatus === 'desconectado') {
      // Desativar conexão se desconectou
      const { error: deactivateError } = await supabaseAdmin
        .from('api_connections')
        .update({
          status: 'disconnected',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceKey)
        .eq('organization_id', organizationId);

      if (deactivateError) {
        console.error('❌ Erro ao desativar conexão:', deactivateError);
      } else {
        console.log('✅ Conexão desativada');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar status de conexão:', error);
  }
}

async function handleMessage(instanceKey: string, data: any, organizationId: string) {
  try {
    console.log(`📱 Processando mensagem para ${instanceKey}:`, data);
    
    // Aqui você pode processar mensagens recebidas
    // Por exemplo, salvar na tabela de conversas, etc.
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

async function handleDelivery(instanceKey: string, data: any, organizationId: string) {
  try {
    console.log(`📤 Processando status de entrega para ${instanceKey}:`, data);
    
    // Aqui você pode processar status de entrega de mensagens
    // Por exemplo, atualizar status de mensagens enviadas
    
  } catch (error) {
    console.error('❌ Erro ao processar status de entrega:', error);
  }
}
