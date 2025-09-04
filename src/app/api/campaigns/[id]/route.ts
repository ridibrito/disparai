import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function DELETE(
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
    
    if (!campaignId) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório' }, { status: 400 });
    }

    // Verificar se a campanha pertence ao usuário
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Verificar se a campanha pode ser deletada
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return NextResponse.json({ 
        error: 'Não é possível excluir campanhas que estão sendo enviadas ou já foram enviadas' 
      }, { status: 400 });
    }

    // Deletar mensagens da campanha primeiro
    await supabase
      .from('campaign_messages')
      .delete()
      .eq('campaign_id', campaignId);

    // Deletar a campanha
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Erro ao deletar campanha:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir campanha' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Campanha excluída com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao excluir campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

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
    
    if (!campaignId) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório' }, { status: 400 });
    }

    // Buscar campanha com detalhes
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        api_connections(*),
        campaign_messages(
          *,
          contacts(*)
        )
      `)
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: campaign
    });

  } catch (error: any) {
    console.error('Erro ao buscar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
