import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Retomar campanha
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
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    // Verificar se a campanha pode ser retomada
    if (campaign.status !== 'paused') {
      return NextResponse.json({ 
        error: 'Apenas campanhas pausadas podem ser retomadas' 
      }, { status: 400 });
    }

    // Atualizar status da campanha para 'in_progress'
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({ 
        status: 'in_progress'
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Erro ao retomar campanha:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao retomar campanha' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Campanha retomada com sucesso' 
    });

  } catch (error) {
    console.error('Erro no POST /api/campaigns/[id]/resume:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
