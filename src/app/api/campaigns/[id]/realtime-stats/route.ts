import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const campaignId = params.id;

    // Buscar a campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Buscar estatísticas das mensagens
    const { data: messageStats, error: statsError } = await supabase
      .from('campaign_messages')
      .select('status, sent_at, delivered_at, read_at, error_message')
      .eq('campaign_id', campaignId);

    if (statsError) {
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    // Calcular estatísticas
    const stats = {
      total: messageStats.length,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      deliveryRate: 0,
      readRate: 0,
      failureRate: 0
    };

    // Contar por status
    messageStats.forEach(msg => {
      switch (msg.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'sent':
          stats.sent++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'read':
          stats.read++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    });

    // Calcular taxas
    const sentMessages = stats.sent + stats.delivered + stats.read + stats.failed;
    if (sentMessages > 0) {
      stats.deliveryRate = Math.round((stats.delivered / sentMessages) * 100);
      stats.readRate = Math.round((stats.read / sentMessages) * 100);
      stats.failureRate = Math.round((stats.failed / sentMessages) * 100);
    }

    // Buscar mensagens com erro para detalhes
    const { data: failedMessages, error: failedError } = await supabase
      .from('campaign_messages')
      .select('error_message, sent_at')
      .eq('campaign_id', campaignId)
      .eq('status', 'failed')
      .limit(10);

    // Calcular progresso se a campanha estiver em andamento
    let progress = 0;
    if (campaign.status === 'sending' && stats.total > 0) {
      progress = Math.round(((stats.sent + stats.delivered + stats.read + stats.failed) / stats.total) * 100);
    } else if (campaign.status === 'sent' || campaign.status === 'completed') {
      progress = 100;
    }

    // Estimar tempo restante (se em andamento)
    let estimatedTimeRemaining = null;
    if (campaign.status === 'sending' && campaign.started_at && stats.sent > 0) {
      const startTime = new Date(campaign.started_at).getTime();
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - startTime;
      const messagesPerSecond = stats.sent / (elapsedTime / 1000);
      
      if (messagesPerSecond > 0) {
        const remainingMessages = stats.total - (stats.sent + stats.delivered + stats.read + stats.failed);
        estimatedTimeRemaining = Math.round(remainingMessages / messagesPerSecond);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          started_at: campaign.started_at,
          completed_at: campaign.completed_at,
          progress
        },
        statistics: stats,
        failedMessages: failedMessages || [],
        estimatedTimeRemaining,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas em tempo real:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
