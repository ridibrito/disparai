import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar conversas do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar conversas com informações do contato e última mensagem
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        contact_id,
        user_id,
        status,
        created_at,
        updated_at,
        contacts!inner(
          id,
          name,
          phone
        ),
        messages(
          id,
          content,
          sender,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar conversas' 
      }, { status: 500 });
    }

    // Processar conversas para incluir última mensagem
    const processedConversations = conversations?.map((conv: any) => {
      const lastMessage = conv.messages?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        id: conv.id,
        contact_id: conv.contact_id,
        user_id: conv.user_id,
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        contacts: conv.contacts,
        last_message_content: lastMessage?.content || '',
        last_message_created_at: lastMessage?.created_at || '',
        last_message_sender: lastMessage?.sender || null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      conversations: processedConversations
    });

  } catch (error: any) {
    console.error('Erro na API de conversas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - Criar nova conversa
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Iniciando criação de conversa');
    
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ [DEBUG] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('✅ [DEBUG] Usuário autenticado:', user.id);

    const { contact_id, status = 'active' } = await req.json();
    console.log('📝 [DEBUG] Dados recebidos:', { contact_id, status });

    if (!contact_id) {
      console.log('❌ [DEBUG] ID do contato não fornecido');
      return NextResponse.json({ 
        error: 'ID do contato é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se o contato existe e pertence ao usuário
    console.log('🔍 [DEBUG] Buscando contato:', contact_id);
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone')
      .eq('id', contact_id)
      .eq('user_id', user.id)
      .single();

    if (contactError) {
      console.log('❌ [DEBUG] Erro ao buscar contato:', contactError);
      return NextResponse.json({ 
        error: 'Erro ao buscar contato',
        details: contactError.message
      }, { status: 500 });
    }

    if (!contact) {
      console.log('❌ [DEBUG] Contato não encontrado');
      return NextResponse.json({ 
        error: 'Contato não encontrado' 
      }, { status: 404 });
    }

    console.log('✅ [DEBUG] Contato encontrado:', contact);

    // Verificar se já existe uma conversa com este contato
    console.log('🔍 [DEBUG] Verificando conversa existente');
    const { data: existingConversation, error: existingError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('contact_id', contact_id)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.log('❌ [DEBUG] Erro ao verificar conversa existente:', existingError);
      return NextResponse.json({ 
        error: 'Erro ao verificar conversa existente',
        details: existingError.message
      }, { status: 500 });
    }

    if (existingConversation) {
      console.log('⚠️ [DEBUG] Conversa já existe:', existingConversation);
      return NextResponse.json({ 
        error: 'Conversa já existe com este contato' 
      }, { status: 400 });
    }

    // Criar nova conversa
    console.log('🔍 [DEBUG] Criando nova conversa');
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        contact_id,
        user_id: user.id,
        status
      })
      .select(`
        id,
        contact_id,
        user_id,
        status,
        created_at,
        updated_at,
        contacts!inner(
          id,
          name,
          phone
        )
      `)
      .single();

    if (conversationError) {
      console.log('❌ [DEBUG] Erro ao criar conversa:', conversationError);
      return NextResponse.json({ 
        error: 'Erro ao criar conversa',
        details: conversationError.message
      }, { status: 500 });
    }

    console.log('✅ [DEBUG] Conversa criada com sucesso:', conversation);

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        last_message_content: '',
        last_message_created_at: '',
        last_message_sender: null
      }
    });

  } catch (error: any) {
    console.error('Erro na API de criar conversa:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
