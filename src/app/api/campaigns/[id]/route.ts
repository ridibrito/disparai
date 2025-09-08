import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar campanha específica
export async function GET(
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

    // Buscar campanha específica
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar campanha:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar campanha' 
      }, { status: 500 });
    }

    if (!campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    console.log('Campaign data:', {
      id: campaign.id,
      name: campaign.name,
      target_contacts: campaign.target_contacts,
      target_lists: campaign.target_lists,
      message_content: campaign.message_content
    });

    // Tentar buscar mensagens da campanha
    let campaignMessages = [];
    try {
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('campaign_messages')
        .select(`
          id,
          status,
          sent_at,
          delivered_at,
          read_at,
          failed_at,
          error_message,
          contacts!inner(id, name, phone)
        `)
        .eq('campaign_id', campaignId);

      if (!messagesError && messages) {
        campaignMessages = messages;
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens da campanha:', error);
      // Se a tabela não existir, usar array vazio
      campaignMessages = [];
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        campaign_messages: campaignMessages
      }
    });

  } catch (error: any) {
    console.error('Erro na API de campanha específica:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PUT - Atualizar campanha
export async function PUT(
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
    const body = await req.json();

    // Atualizar campanha
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar campanha:', error);
      return NextResponse.json({ 
        error: 'Erro ao atualizar campanha' 
      }, { status: 500 });
    }

    if (!campaign) {
      return NextResponse.json({ 
        error: 'Campanha não encontrada' 
      }, { status: 404 });
    }

    return NextResponse.json(campaign);

  } catch (error: any) {
    console.error('Erro na API de atualização de campanha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - Deletar campanha
export async function DELETE(
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

    // Deletar campanha
    const { error } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar campanha:', error);
      return NextResponse.json({ 
        error: 'Erro ao deletar campanha' 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Campanha deletada com sucesso' });

  } catch (error: any) {
    console.error('Erro na API de exclusão de campanha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}