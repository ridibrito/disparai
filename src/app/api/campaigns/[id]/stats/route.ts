import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar estatísticas de uma campanha específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== CAMPAIGN STATS API ===');
    
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Stats API - Auth result:', { 
      user: user?.id, 
      email: user?.email,
      authError: authError?.message 
    });

    if (!user) {
      console.log('Stats API - No authenticated user');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const campaignId = params.id;
    console.log('Stats API - Campaign ID:', campaignId);

    // Verificar se a campanha existe e pertence ao usuário
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError) {
      console.error('Erro ao buscar campanha:', campaignError);
      return NextResponse.json({ 
        error: 'Erro ao buscar campanha' 
      }, { status: 500 });
    }

    if (!campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    // Usar estatísticas baseadas no target_contacts da campanha
    console.log('Calculando estatísticas para campanha:', campaignId);
    
    // Buscar a campanha completa para pegar target_contacts
    const { data: fullCampaign } = await supabaseAdmin
      .from('campaigns')
      .select('target_contacts, target_lists')
      .eq('id', campaignId)
      .single();
    
    console.log('Campaign data for stats:', {
      target_contacts: fullCampaign?.target_contacts,
      target_lists: fullCampaign?.target_lists
    });
    
    const totalContacts = fullCampaign?.target_contacts?.length || 0;
    
    const statistics = {
      total_recipients: totalContacts,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: totalContacts
    };

    return NextResponse.json({
      campaign_id: campaignId,
      campaign_name: campaign.name,
      statistics
    });

  } catch (error: any) {
    console.error('Erro na API de estatísticas de campanha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}