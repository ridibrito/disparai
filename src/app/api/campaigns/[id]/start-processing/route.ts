import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Iniciar processamento automático da campanha
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

    // Verificar se a campanha pertence ao usuário
    const { data: campaign, error: checkError } = await supabaseAdmin
      .from('campaigns')
      .select('id, status, message_delay')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    // Verificar se a campanha pode ser processada
    if (campaign.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Campanha não está em andamento' 
      }, { status: 400 });
    }

    // Iniciar processamento em background
    startBackgroundProcessing(params.id, campaign.message_delay || 1);

    return NextResponse.json({ 
      success: true, 
      message: 'Processamento iniciado em background' 
    });

  } catch (error) {
    console.error('Erro no POST /api/campaigns/[id]/start-processing:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para processar mensagens em background
async function startBackgroundProcessing(campaignId: string, messageDelay: number) {
  console.log(`🔄 Iniciando processamento em background para campanha ${campaignId}`);
  
  let isProcessing = true;
  let consecutiveEmptyRounds = 0;
  const maxEmptyRounds = 3; // Parar após 3 rodadas sem mensagens

  while (isProcessing && consecutiveEmptyRounds < maxEmptyRounds) {
    try {
      // Fazer requisição para processar mensagens
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/${campaignId}/send-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        if (data.processed === 0) {
          consecutiveEmptyRounds++;
          console.log(`⏳ Nenhuma mensagem processada, rodada ${consecutiveEmptyRounds}/${maxEmptyRounds}`);
        } else {
          consecutiveEmptyRounds = 0; // Reset contador
          console.log(`✅ Processadas ${data.processed} mensagens (${data.success_count} sucessos, ${data.error_count} erros)`);
        }

        // Aguardar antes da próxima rodada
        await new Promise(resolve => setTimeout(resolve, messageDelay * 1000));
      } else {
        console.error('❌ Erro no processamento:', data.error);
        isProcessing = false;
      }

    } catch (error) {
      console.error('❌ Erro no processamento em background:', error);
      isProcessing = false;
    }
  }

  if (consecutiveEmptyRounds >= maxEmptyRounds) {
    console.log(`✅ Processamento concluído para campanha ${campaignId} - todas as mensagens foram processadas`);
  } else {
    console.log(`❌ Processamento interrompido para campanha ${campaignId}`);
  }
}
