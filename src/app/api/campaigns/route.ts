import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Listar campanhas do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar campanhas do usuário (versão simplificada temporária)
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas:', error);
      return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 });
    }

    // Adicionar estatísticas calculadas baseadas nos contatos
    const campaignsWithStats = campaigns?.map(campaign => {
      const totalRecipients = campaign.target_contacts ? campaign.target_contacts.length : 0;
      return {
        ...campaign,
        statistics: {
          total_recipients: totalRecipients,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          pending: totalRecipients
        }
      };
    }) || [];

    return NextResponse.json({ 
      success: true, 
      campaigns: campaignsWithStats 
    });

  } catch (error) {
    console.error('Erro no GET /api/campaigns:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova campanha
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      message, 
      scheduled_at, 
      target_groups,
      target_contacts,
      target_lists,
      message_delay = 1,
      send_settings = {}
    } = body;

    if (!name || !message) {
      return NextResponse.json({ 
        error: 'Nome e mensagem são obrigatórios' 
      }, { status: 400 });
    }

    // Validação simplificada temporariamente
    // if (!target_contacts || target_contacts.length === 0) {
    //   return NextResponse.json({ 
    //     error: 'Selecione pelo menos um contato' 
    //   }, { status: 400 });
    // }

    // Buscar instância WhatsApp ativa (temporariamente comentado até migrações serem aplicadas)
    // const { data: activeInstance } = await supabaseAdmin
    //   .from('whatsapp_instances')
    //   .select('id')
    //   .eq('status', 'ativo')
    //   .single();

    // Buscar conexão API ativa (temporariamente comentado até migrações serem aplicadas)
    // const { data: activeConnection } = await supabaseAdmin
    //   .from('api_connections')
    //   .select('id')
    //   .eq('user_id', user.id)
    //   .eq('is_active', true)
    //   .eq('status', 'active')
    //   .eq('provider', 'disparai')
    //   .single();

    // Criar campanha (versão de fallback)
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: user.id,
        organization_id: user.id, // Usar user.id como organization_id (padrão multitenant)
        name,
        message_content: message, // Usar message_content que é o campo padrão
        target_contacts: target_contacts || [], // Salvar contatos selecionados
        target_lists: target_lists || [], // Salvar listas selecionadas
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar campanha:', error);
      return NextResponse.json({ 
        error: 'Erro ao criar campanha' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      campaign 
    });

  } catch (error) {
    console.error('Erro no POST /api/campaigns:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
