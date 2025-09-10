import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { DisparaiAPIClient } from '@/lib/disparai-api';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { campaignId } = await req.json();
    
    if (!campaignId) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório' }, { status: 400 });
    }

    // Buscar a campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        api_connections!inner(*)
      `)
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Verificar se a campanha já foi enviada
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json({ error: 'Campanha já foi enviada ou está sendo enviada' }, { status: 400 });
    }

    // Buscar mensagens pendentes da campanha
    const { data: pendingMessages, error: messagesError } = await supabase
      .from('campaign_messages')
      .select(`
        *,
        contacts!inner(*)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (messagesError || !pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma mensagem pendente encontrada' }, { status: 400 });
    }

    // Atualizar status da campanha para "enviando"
    await supabase
      .from('campaigns')
      .update({ status: 'sending', started_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Iniciar processamento assíncrono
    processCampaignAsync(campaignId, campaign, pendingMessages);

    return NextResponse.json({
      success: true,
      message: 'Campanha iniciada com sucesso',
      data: {
        campaignId,
        totalMessages: pendingMessages.length,
        status: 'processing'
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// Função assíncrona para processar a campanha
async function processCampaignAsync(
  campaignId: string,
  campaign: any,
  pendingMessages: any[]
) {
  const supabase = await createServerClient();
  
  try {
    // Inicializar cliente da API Disparai
    const disparaiClient = new DisparaiAPIClient({
      instanceKey: campaign.api_connections.instance_id,
      apiToken: campaign.api_connections.api_key
    });
    
    // Preparar mensagens para envio em lote
    const messagesToSend = pendingMessages.map(message => {
      // Personalizar mensagem com dados do contato
      let personalizedMessage = campaign.message;
      if (message.contacts.name) {
        personalizedMessage = personalizedMessage.replace(/\{\{nome\}\}/g, message.contacts.name);
      }
      if (message.contacts.phone) {
        personalizedMessage = personalizedMessage.replace(/\{\{telefone\}\}/g, message.contacts.phone);
      }

      return {
        contactId: message.id,
        phoneNumber: message.contacts.phone,
        message: personalizedMessage
      };
    });

    // Enviar mensagens em lote
    const sendResult = await disparaiClient.sendBulkMessages({
      instanceKey: campaign.api_connections.instance_id,
      messages: messagesToSend,
      batchSize: 10,
      delayBetweenBatches: 1000,
      onProgress: async (sent, total) => {
        console.log(`Campanha ${campaignId}: ${sent}/${total} mensagens processadas`);
        
        // Atualizar progresso no banco (opcional)
        await supabase
          .from('campaigns')
          .update({ 
            metadata: { 
              progress: { sent, total, percentage: Math.round((sent / total) * 100) }
            }
          })
          .eq('id', campaignId);
      }
    });

    // Atualizar status das mensagens no banco
    for (const result of sendResult.results) {
      if (result.success) {
        await supabase
          .from('campaign_messages')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: result.messageId || null
          })
          .eq('id', result.contactId);
      } else {
        await supabase
          .from('campaign_messages')
          .update({ 
            status: 'failed',
            error_message: result.error,
            sent_at: new Date().toISOString()
          })
          .eq('id', result.contactId);
      }
    }

    // Atualizar status final da campanha
    const finalStatus = sendResult.summary.failed === 0 ? 'sent' : 
                       (sendResult.summary.sent > 0 ? 'partial' : 'failed');
    
    await supabase
      .from('campaigns')
      .update({ 
        status: finalStatus,
        completed_at: new Date().toISOString(),
        metadata: {
          summary: {
            total: sendResult.summary.total,
            sent: sendResult.summary.sent,
            failed: sendResult.summary.failed,
            percentage: Math.round((sendResult.summary.sent / sendResult.summary.total) * 100)
          }
        }
      })
      .eq('id', campaignId);

    console.log(`Campanha ${campaignId} processada: ${sendResult.summary.sent}/${sendResult.summary.total} enviadas`);

  } catch (error: any) {
    console.error(`Erro ao processar campanha ${campaignId}:`, error);
    
    // Marcar campanha como falhou
    await supabase
      .from('campaigns')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: { error: error.message }
      })
      .eq('id', campaignId);
  }
}
