import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const conversationId = params.id;

    // Verificar se a conversa pertence ao usuário
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar mensagens da conversa
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Erro na API de mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const conversationId = params.id;
    const body = await request.json();
    const { content, type = 'text', media_url } = body;

    if (!content) {
      return NextResponse.json({ error: 'Conteúdo da mensagem é obrigatório' }, { status: 400 });
    }

    // Verificar se a conversa pertence ao usuário
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        id, 
        user_id,
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
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar instância WhatsApp ativa do usuário
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ativo')
      .single();

    if (instanceError || !instance) {
      return NextResponse.json({ error: 'Nenhuma instância WhatsApp ativa encontrada' }, { status: 400 });
    }

    // Enviar mensagem via API do WhatsApp
    const messageResponse = await sendWhatsAppMessage({
      instanceKey: instance.instance_key,
      to: conversation.contacts.phone,
      message: content,
      type,
      mediaUrl: media_url
    });

    if (!messageResponse.success) {
      return NextResponse.json({ 
        error: 'Erro ao enviar mensagem: ' + messageResponse.error 
      }, { status: 500 });
    }

    // Salvar mensagem no banco
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content,
        media_url,
        type,
        status: 'sent'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
    }

    // Atualizar última mensagem da conversa
    await supabase
      .from('conversations')
      .update({
        last_message_content: content,
        last_message_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return NextResponse.json({ 
      message: newMessage,
      whatsappResponse: messageResponse
    });
  } catch (error) {
    console.error('Erro na API de mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage({
  instanceKey,
  to,
  message,
  type = 'text',
  mediaUrl
}: {
  instanceKey: string;
  to: string;
  message: string;
  type?: string;
  mediaUrl?: string;
}) {
  try {
    // Usar a instância conectada (MegaAPI)
    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    const payload: any = {
      number: to,
      text: message
    };

    if (type === 'image' && mediaUrl) {
      payload.image = mediaUrl;
    } else if (type === 'document' && mediaUrl) {
      payload.document = mediaUrl;
    }

    const response = await fetch(`${host}/rest/sendMessage/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      messageId: data.key?.id || data.id || `msg_${Date.now()}`
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem via WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}