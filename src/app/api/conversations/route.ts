import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar organization_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 });
    }

    // Buscar conversas com informações do contato
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts!inner(
          id,
          name,
          phone,
          created_at
        )
      `)
      .eq('organization_id', userData.organization_id)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error('Erro ao buscar conversas:', conversationsError);
      return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
    }

    // Buscar última mensagem e contagem de mensagens não lidas de cada conversa
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender, status')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Contar mensagens do contato (simplificado - todas as mensagens do contato)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('sender', 'contact');

        return {
          ...conversation,
          contact: conversation.contacts,
          last_message: lastMessage || null,
          // Adicionar campos de atendimento com valores padrão
          attendance_type: conversation.status === 'human' ? 'transferred' : 'ai',
          attendance_status: conversation.status === 'human' ? 'pending' : 'active',
          unread_count: unreadCount || 0,
          has_attachments: conversation.has_attachments || false,
          is_archived: conversation.is_archived || false,
          is_favorite: conversation.is_favorite || false,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithLastMessage });
  } catch (error) {
    console.error('Erro na API de conversas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { contact_id } = body;

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id é obrigatório' }, { status: 400 });
    }

    // Verificar se o contato existe e pertence ao usuário
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, phone, organization_id')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    // Verificar se já existe uma conversa com este contato
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contact_id)
      .eq('user_id', user.id)
      .single();

    if (existingConversation) {
      return NextResponse.json({ 
        conversation: existingConversation,
        message: 'Conversa já existe' 
      });
    }

    // Criar nova conversa
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        contact_id,
        user_id: user.id,
        status: 'active'
      })
      .select(`
        *,
        contacts!inner(
          id,
          name,
          phone,
          created_at
        )
      `)
      .single();

    if (conversationError) {
      console.error('Erro ao criar conversa:', conversationError);
      return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
    }

    return NextResponse.json({ 
      conversation: {
        ...newConversation,
        contact: newConversation.contacts,
        last_message: null
      }
    });
  } catch (error) {
    console.error('Erro na API de conversas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}