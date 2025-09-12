import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  console.log('📥 API messages GET chamada!');
  
  try {
    const conversationId = params.conversationId;
    console.log('📥 Buscando mensagens para conversa:', conversationId);
    
    if (!conversationId) {
      return NextResponse.json({ error: 'ID da conversa é obrigatório' }, { status: 400 });
    }

    // Cliente admin para operações que precisam contornar RLS
    const supabaseAdmin = createClient(
      env.supabase.url!,
      env.supabase.serviceRoleKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Buscar mensagens da conversa
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
    }

    console.log('📥 Mensagens encontradas:', messages?.length || 0);

    return NextResponse.json({ 
      success: true, 
      messages: messages || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  console.log('🚀 API messages POST chamada!');
  
  try {
    const conversationId = params.conversationId;
    const body = await request.json();
    const { content, type = 'text' } = body;
    
    console.log('📤 Enviando mensagem:', { conversationId, content, type });
    
    if (!conversationId || !content) {
      return NextResponse.json({ error: 'ID da conversa e conteúdo são obrigatórios' }, { status: 400 });
    }

    // Cliente admin para operações que precisam contornar RLS
    const supabaseAdmin = createClient(
      env.supabase.url!,
      env.supabase.serviceRoleKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Buscar a conversa e o contato
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        contact_id,
        organization_id,
        contacts!inner(
          phone,
          name
        )
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      console.error('❌ Erro ao buscar conversa:', conversationError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    console.log('📤 Conversa encontrada:', conversation);

    // Buscar instância ativa do WhatsApp
    console.log('🔍 Buscando instância WhatsApp para organization_id:', conversation.organization_id);
    
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', conversation.organization_id)
      .eq('status', 'ativo')
      .single();

    console.log('🔍 Resultado da busca de instância:', { instance, instanceError });

    if (instanceError || !instance) {
      console.error('❌ Erro ao buscar instância WhatsApp:', instanceError);
      
      // Tentar buscar qualquer instância para debug
      const { data: allInstances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*');
      console.log('🔍 Todas as instâncias no banco:', allInstances);
      
      return NextResponse.json({ error: 'Nenhuma instância WhatsApp ativa encontrada' }, { status: 400 });
    }

    console.log('📤 Instância WhatsApp encontrada:', instance);

    // Enviar mensagem via Mega API
    const megaApiPayload = {
      instance_key: 'coruss-whatsapp-01',
      to: conversation.contacts.phone,
      message: content,
      type: type
    };
    
    console.log('📤 Enviando para Mega API:', megaApiPayload);
    
    const megaApiResponse = await fetch(`${env.megaApi.host}/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.megaApi.token}`,
      },
      body: JSON.stringify(megaApiPayload)
    });

    const megaApiResult = await megaApiResponse.json();
    console.log('📥 Resposta da Mega API:', megaApiResult);

    if (!megaApiResponse.ok) {
      console.error('❌ Erro ao enviar mensagem via Mega API:', megaApiResult);
      return NextResponse.json({ 
        error: 'Erro ao enviar mensagem', 
        details: megaApiResult 
      }, { status: 500 });
    }

    // Salvar mensagem no banco de dados
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content: content,
        organization_id: conversation.organization_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Erro ao salvar mensagem:', messageError);
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
    }

    // Atualizar última mensagem da conversa
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ 
        last_message_content: content,
        last_message_created_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('❌ Erro ao atualizar conversa:', updateError);
    }

    console.log('✅ Mensagem enviada com sucesso:', message);

    return NextResponse.json({ 
      success: true, 
      message: message,
      megaApiResponse: megaApiResult
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}