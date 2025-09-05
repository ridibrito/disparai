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

    // Inicializar cliente da API Disparai
    const disparaiClient = new DisparaiAPIClient();
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Enviar mensagens em lotes
    const batchSize = 10; // Enviar 10 mensagens por vez
    for (let i = 0; i < pendingMessages.length; i += batchSize) {
      const batch = pendingMessages.slice(i, i + batchSize);
      
      // Processar lote em paralelo
      const batchPromises = batch.map(async (message) => {
        try {
          // Personalizar mensagem com dados do contato
          let personalizedMessage = campaign.message;
          if (message.contacts.name) {
            personalizedMessage = personalizedMessage.replace(/\{\{nome\}\}/g, message.contacts.name);
          }
          if (message.contacts.phone) {
            personalizedMessage = personalizedMessage.replace(/\{\{telefone\}\}/g, message.contacts.phone);
          }

          // Enviar mensagem via API Disparai
          const sendResult = await disparaiClient.sendSimpleMessage({
            instanceKey: campaign.api_connections.instance_id,
            phoneNumber: message.contacts.phone,
            message: personalizedMessage
          });

          if (sendResult.error) {
            throw new Error(sendResult.message || 'Erro ao enviar mensagem');
          }

          // Atualizar status da mensagem para "enviada"
          await supabase
            .from('campaign_messages')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              external_id: sendResult.data?.messageId || null
            })
            .eq('id', message.id);

          return { success: true, messageId: message.id };
        } catch (error: any) {
          // Atualizar status da mensagem para "falhou"
          await supabase
            .from('campaign_messages')
            .update({ 
              status: 'failed',
              error_message: error.message,
              sent_at: new Date().toISOString()
            })
            .eq('id', message.id);

          return { success: false, messageId: message.id, error: error.message };
        }
      });

      // Aguardar o lote atual
      const batchResults = await Promise.all(batchPromises);
      
      // Contar resultados
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(result.error);
        }
      });

      // Pequena pausa entre lotes para não sobrecarregar a API
      if (i + batchSize < pendingMessages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Atualizar status final da campanha
    const finalStatus = errorCount === 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed');
    await supabase
      .from('campaigns')
      .update({ 
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campanha processada com sucesso',
      data: {
        campaignId,
        totalMessages: pendingMessages.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 5) // Retornar apenas os primeiros 5 erros
      }
    });

  } catch (error: any) {
    console.error('Erro ao enviar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
