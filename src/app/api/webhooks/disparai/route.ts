import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Obter dados do webhook
    const webhookData = await req.json();
    
    console.log('Webhook recebido do Disparai:', JSON.stringify(webhookData, null, 2));

    // Verificar se é uma atualização de status de mensagem
    if (webhookData.type === 'message_status' && webhookData.messageId) {
      await updateMessageStatus(supabase, webhookData);
    }

    // Verificar se é uma atualização de status da instância
    if (webhookData.type === 'instance_status' && webhookData.instanceKey) {
      await updateInstanceStatus(supabase, webhookData);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para atualizar status de mensagem
async function updateMessageStatus(supabase: any, webhookData: any) {
  try {
    const { messageId, status, timestamp } = webhookData;

    // Buscar a mensagem no banco pelo external_id
    const { data: message, error: messageError } = await supabase
      .from('campaign_messages')
      .select('*')
      .eq('external_id', messageId)
      .single();

    if (messageError || !message) {
      console.log(`Mensagem não encontrada para ID: ${messageId}`);
      return;
    }

    // Mapear status do webhook para status do banco
    const statusMap: { [key: string]: string } = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed'
    };

    const newStatus = statusMap[status] || 'sent';
    const updateData: any = { status: newStatus };

    // Adicionar timestamp baseado no status
    if (status === 'delivered') {
      updateData.delivered_at = timestamp || new Date().toISOString();
    } else if (status === 'read') {
      updateData.read_at = timestamp || new Date().toISOString();
    } else if (status === 'failed') {
      updateData.error_message = webhookData.error || 'Falha no envio';
    }

    // Atualizar mensagem
    const { error: updateError } = await supabase
      .from('campaign_messages')
      .update(updateData)
      .eq('id', message.id);

    if (updateError) {
      console.error('Erro ao atualizar status da mensagem:', updateError);
    } else {
      console.log(`Status da mensagem ${messageId} atualizado para: ${newStatus}`);
    }

  } catch (error: any) {
    console.error('Erro ao atualizar status de mensagem:', error);
  }
}

// Função para atualizar status da instância
async function updateInstanceStatus(supabase: any, webhookData: any) {
  try {
    const { instanceKey, status, qrCode, phoneNumber } = webhookData;

    // Buscar a conexão da API
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('instance_id', instanceKey)
      .single();

    if (connectionError || !connection) {
      console.log(`Conexão não encontrada para instância: ${instanceKey}`);
      return;
    }

    // Mapear status da instância
    const statusMap: { [key: string]: string } = {
      'connected': 'connected',
      'disconnected': 'disconnected',
      'qr_code': 'pending',
      'failed': 'failed'
    };

    const newStatus = statusMap[status] || 'pending';
    const updateData: any = { 
      status: newStatus,
      is_active: status === 'connected'
    };

    // Adicionar dados específicos
    if (qrCode) {
      updateData.metadata = { ...connection.metadata, qrCode };
    }
    if (phoneNumber) {
      updateData.phone_number_id = phoneNumber;
    }

    // Atualizar conexão
    const { error: updateError } = await supabase
      .from('api_connections')
      .update(updateData)
      .eq('id', connection.id);

    if (updateError) {
      console.error('Erro ao atualizar status da instância:', updateError);
    } else {
      console.log(`Status da instância ${instanceKey} atualizado para: ${newStatus}`);
    }

  } catch (error: any) {
    console.error('Erro ao atualizar status da instância:', error);
  }
}

// Endpoint GET para verificação de webhook
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook endpoint ativo',
    timestamp: new Date().toISOString()
  });
}