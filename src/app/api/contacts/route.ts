import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar contatos do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Contacts API - Auth result:', { 
      user: user?.id, 
      email: user?.email,
      authError: authError?.message 
    });

    if (!user) {
      console.log('Contacts API - No authenticated user');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar contatos do usuário (versão de fallback)
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contatos:', error);
      return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      contacts: contacts || [] 
    });

  } catch (error) {
    console.error('Erro no GET /api/contacts:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo contato
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, group, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ 
        error: 'Nome e telefone são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se já existe contato com este telefone
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('phone', phone)
      .single();

    if (existingContact) {
      return NextResponse.json({ 
        error: 'Já existe um contato com este telefone' 
      }, { status: 400 });
    }

    // Criar contato (versão de fallback)
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: user.id,
        organization_id: user.id, // Usar user.id como organization_id (padrão multitenant)
        name,
        phone
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar contato:', error);
      return NextResponse.json({ 
        error: 'Erro ao criar contato' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      contact 
    });

  } catch (error) {
    console.error('Erro no POST /api/contacts:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
