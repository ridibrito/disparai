import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';
import { sendInteractive } from '@/lib/whatsapp';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const { body, buttons } = await request.json();

    if (!body || !buttons || !Array.isArray(buttons)) {
      return NextResponse.json(
        { error: 'body e buttons são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServerClientWithServiceRole();

    // Buscar a conversa e contato
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts (*)
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar a instância WhatsApp
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', conversation.organization_id)
      .eq('status', 'ativo')
      .single();

    if (instanceError || !whatsappInstance) {
      return NextResponse.json(
        { error: 'Instância WhatsApp não encontrada' },
        { status: 404 }
      );
    }

    // Buscar conexão da API
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('instance_id', whatsappInstance.instance_key)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Conexão API não encontrada' },
        { status: 404 }
      );
    }

    // Formatar número de telefone
    const phoneNumber = `+${conversation.contacts.phone}`;

    // Enviar mensagem interativa
    const response = await sendInteractive(
      phoneNumber,
      body,
      buttons,
      connection.user_id,
      connection.type
    );

    // Salvar mensagem no banco
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'system',
        sender_type: 'system',
        content: body,
        message_type: 'interactive',
        metadata: {
          type: 'button',
          buttons: buttons
        },
        organization_id: conversation.organization_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar mensagem interativa:', saveError);
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem interativa enviada com sucesso',
      data: {
        response,
        savedMessage
      }
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem interativa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
