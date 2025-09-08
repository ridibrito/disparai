import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";
import { DisparaiAPIClient } from '@/lib/disparai-api';

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Processar envio de mensagens da campanha
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        whatsapp_instances!inner (
          instance_key,
          status
        ),
        api_connections!inner (
          api_key,
          status
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    // Verificar se a campanha pode enviar mensagens
    if (campaign.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Campanha não está em andamento' 
      }, { status: 400 });
    }

    // Verificar se há instância WhatsApp ativa
    if (!campaign.whatsapp_instances || campaign.whatsapp_instances.status !== 'ativo') {
      return NextResponse.json({ 
        error: 'Nenhuma instância WhatsApp ativa encontrada' 
      }, { status: 400 });
    }

    // Buscar mensagens pendentes
    const { data: pendingMessages, error: messagesError } = await supabaseAdmin
      .from('campaign_messages')
      .select(`
        id,
        contact_id,
        phone_number,
        recipient_name,
        message_data,
        retry_count
      `)
      .eq('campaign_id', params.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Processar 10 mensagens por vez

    if (messagesError) {
      console.error('Erro ao buscar mensagens pendentes:', messagesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar mensagens pendentes' 
      }, { status: 500 });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      // Verificar se todas as mensagens foram enviadas
      const { data: allMessages } = await supabaseAdmin
        .from('campaign_messages')
        .select('status')
        .eq('campaign_id', params.id);

      const hasPending = allMessages?.some(msg => msg.status === 'pending');
      
      if (!hasPending) {
        // Marcar campanha como concluída
        await supabaseAdmin
          .from('campaigns')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', params.id);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma mensagem pendente',
        processed: 0
      });
    }

    // Criar cliente da API Disparai
    const disparaiClient = new DisparaiAPIClient({
      instanceKey: campaign.whatsapp_instances.instance_key,
      apiToken: campaign.api_connections.api_key
    });

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Processar mensagens
    for (const message of pendingMessages) {
      try {
        // Personalizar mensagem com nome do contato
        let personalizedMessage = campaign.message;
        if (message.recipient_name) {
          personalizedMessage = personalizedMessage.replace(/\{nome\}/g, message.recipient_name);
        }

        // Enviar mensagem via API Disparai
        const sendResult = await disparaiClient.sendSimpleMessage({
          instanceKey: campaign.whatsapp_instances.instance_key,
          phoneNumber: message.phone_number,
          message: personalizedMessage
        });

        if (sendResult.error) {
          // Marcar como falha
          await supabaseAdmin
            .from('campaign_messages')
            .update({
              status: 'failed',
              error_message: sendResult.message,
              retry_count: message.retry_count + 1,
              next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry em 5 minutos
            })
            .eq('id', message.id);

          errorCount++;
        } else {
          // Marcar como enviada
          await supabaseAdmin
            .from('campaign_messages')
            .update({
              status: 'sent',
              whatsapp_message_id: sendResult.data?.messageId,
              sent_at: new Date().toISOString()
            })
            .eq('id', message.id);

          successCount++;
        }

        processedCount++;

        // Delay entre mensagens
        if (campaign.message_delay && campaign.message_delay > 0) {
          await new Promise(resolve => setTimeout(resolve, campaign.message_delay * 1000));
        }

      } catch (error) {
        console.error(`Erro ao processar mensagem ${message.id}:`, error);
        
        // Marcar como falha
        await supabaseAdmin
          .from('campaign_messages')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            retry_count: message.retry_count + 1,
            next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          })
          .eq('id', message.id);

        errorCount++;
        processedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processadas ${processedCount} mensagens`,
      processed: processedCount,
      success_count: successCount,
      error_count: errorCount
    });

  } catch (error) {
    console.error('Erro no POST /api/campaigns/[id]/send-messages:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
