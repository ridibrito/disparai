import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { DisparaiAPIClient } from '@/lib/disparai-api';

export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contactId = params.contactId;
    
    if (!contactId) {
      return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
    }

    // Buscar conversa do contato
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', session.user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar mensagens da conversa
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || []
    });

  } catch (error: any) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contactId = params.contactId;
    const { message } = await req.json();
    
    if (!contactId || !message) {
      return NextResponse.json({ error: 'ID do contato e mensagem são obrigatórios' }, { status: 400 });
    }

    // Buscar contato
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', session.user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    // Buscar conexão ativa do usuário
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', 'whatsapp_disparai')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Nenhuma conexão WhatsApp ativa encontrada' }, { status: 400 });
    }

    // Enviar mensagem via API Disparai
    const disparaiClient = new DisparaiAPIClient({
      instanceKey: connection.instance_id,
      apiToken: connection.api_key
    });

    const sendResult = await disparaiClient.sendSimpleMessage({
      instanceKey: connection.instance_id,
      phoneNumber: contact.phone,
      message: message
    });

    if (sendResult.error) {
      return NextResponse.json({ 
        error: 'Erro ao enviar mensagem', 
        details: sendResult.message 
      }, { status: 500 });
    }

    // Buscar ou criar conversa
    let { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', session.user.id)
      .single();

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa:', conversationError);
      return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 });
    }

    if (!conversation) {
      const { data: newConversation, error: createConvError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contactId,
          user_id: session.user.id,
          status: 'active'
        })
        .select('id')
        .single();

      if (createConvError) {
        console.error('Erro ao criar conversa:', createConvError);
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
      }

      conversation = newConversation;
    }

    // Salvar mensagem no banco
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'user',
        content: message,
        external_id: sendResult.data?.messageId || null
      })
      .select()
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: savedMessage
    });

  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
