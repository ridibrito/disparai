import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Iniciar uma campanha/disparo
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

    const campaignId = params.id;

    // Verificar se a campanha existe e pertence ao usuário
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
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

    // Verificar se a campanha já está em execução
    if (campaign.status === 'running' || campaign.status === 'completed') {
      return NextResponse.json({ 
        error: 'Campanha já está em execução ou foi concluída' 
      }, { status: 400 });
    }

    // Verificar se há contatos para esta campanha
    console.log('Campaign data for start:', {
      target_contacts: campaign.target_contacts,
      target_lists: campaign.target_lists
    });

    if (!campaign.target_contacts || campaign.target_contacts.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum contato encontrado para esta campanha' 
      }, { status: 400 });
    }

    const targetContacts = campaign.target_contacts;

    // Atualizar status da campanha para 'running'
    const { data: updatedCampaign, error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar campanha:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao iniciar campanha' 
      }, { status: 500 });
    }

    // TODO: Aqui você pode integrar com a API do WhatsApp para enviar as mensagens
    // Por enquanto, vamos simular o início da campanha

    return NextResponse.json({
      message: 'Campanha iniciada com sucesso',
      campaign: updatedCampaign,
      contacts: targetContacts,
      totalContacts: targetContacts.length
    });

  } catch (error: any) {
    console.error('Erro na API de início de campanha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}