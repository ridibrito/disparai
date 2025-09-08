import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar mensagens de uma conversa
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

    const conversationId = params.id;

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        contact_id,
        user_id,
        status,
        contacts!inner(
          id,
          name,
          phone
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ 
        error: 'Conversa não encontrada' 
      }, { status: 404 });
    }

    // Buscar mensagens da conversa
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar mensagens' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages: messages || []
    });

  } catch (error: any) {
    console.error('Erro na API de mensagens:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - Enviar mensagem em uma conversa
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

    const conversationId = params.id;
    const { message, media_url, media_type } = await req.json();

    if (!message) {
      return NextResponse.json({ 
        error: 'Mensagem é obrigatória' 
      }, { status: 400 });
    }

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        contact_id,
        user_id,
        status,
        contacts!inner(
          id,
          name,
          phone
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ 
        error: 'Conversa não encontrada' 
      }, { status: 404 });
    }

    // Buscar conexão ativa do usuário
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp_disparai')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ 
        error: 'Nenhuma conexão WhatsApp ativa encontrada' 
      }, { status: 400 });
    }

    // TODO: Integrar com API do WhatsApp para enviar mensagem
    // Por enquanto, vamos apenas salvar a mensagem no banco

    // Salvar mensagem no banco
    const { data: savedMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content: message,
        media_url: media_url || null,
        media_type: media_type || null,
        status: 'sent'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
      return NextResponse.json({ 
        error: 'Erro ao salvar mensagem' 
      }, { status: 500 });
    }

    // Atualizar updated_at da conversa
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      message: savedMessage
    });

  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
