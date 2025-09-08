import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Atualizar status de mensagem via webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      whatsapp_message_id, 
      status, 
      phone_number,
      timestamp 
    } = body;

    if (!whatsapp_message_id || !status) {
      return NextResponse.json({ 
        error: 'whatsapp_message_id e status são obrigatórios' 
      }, { status: 400 });
    }

    console.log(`📱 Atualizando status da mensagem ${whatsapp_message_id} para ${status}`);

    // Buscar mensagem pelo ID do WhatsApp
    const { data: message, error: messageError } = await supabaseAdmin
      .from('campaign_messages')
      .select('id, status, phone_number')
      .eq('whatsapp_message_id', whatsapp_message_id)
      .single();

    if (messageError || !message) {
      console.log(`⚠️ Mensagem não encontrada: ${whatsapp_message_id}`);
      return NextResponse.json({ 
        error: 'Mensagem não encontrada' 
      }, { status: 404 });
    }

    // Verificar se o número de telefone confere (segurança adicional)
    if (phone_number && message.phone_number !== phone_number) {
      console.log(`⚠️ Número de telefone não confere para mensagem ${whatsapp_message_id}`);
      return NextResponse.json({ 
        error: 'Número de telefone não confere' 
      }, { status: 400 });
    }

    // Mapear status do WhatsApp para status interno
    let newStatus = message.status;
    let updateData: any = {};

    switch (status.toLowerCase()) {
      case 'delivered':
        newStatus = 'delivered';
        updateData.delivered_at = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
        break;
      case 'read':
        newStatus = 'read';
        updateData.read_at = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
        break;
      case 'failed':
        newStatus = 'failed';
        updateData.error_message = 'Falha no envio via WhatsApp';
        break;
      default:
        // Manter status atual se não for um status conhecido
        break;
    }

    // Atualizar mensagem se o status mudou
    if (newStatus !== message.status) {
      const { error: updateError } = await supabaseAdmin
        .from('campaign_messages')
        .update({
          status: newStatus,
          ...updateData
        })
        .eq('id', message.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar status da mensagem:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao atualizar status da mensagem' 
        }, { status: 500 });
      }

      console.log(`✅ Status da mensagem ${whatsapp_message_id} atualizado para ${newStatus}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status atualizado com sucesso' 
    });

  } catch (error) {
    console.error('Erro no POST /api/campaigns/update-message-status:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
