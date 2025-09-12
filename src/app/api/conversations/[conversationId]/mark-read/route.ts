import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId;
    console.log('📖 API mark-read chamada para conversa:', conversationId);
    
    if (!conversationId) {
      return NextResponse.json({ error: 'ID da conversa é obrigatório' }, { status: 400 });
    }

    // Cliente admin para operações que precisam contornar RLS
    const supabaseAdmin = createClient(
      env.supabase.url,
      env.supabase.serviceRoleKey,
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

    console.log('📖 Conversa encontrada:', conversation);

    // Atualizar unread_count para 0
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (updateError) {
      console.error('❌ Erro ao atualizar conversa:', updateError);
      return NextResponse.json({ error: 'Erro ao marcar como lida' }, { status: 500 });
    }

    // Enviar confirmação de leitura via Mega API
    try {
      const jid = `${conversation.contacts.phone}@s.whatsapp.net`;
      const megaApiPayload = {
        jid: jid
      };
      
      console.log('📤 Enviando confirmação de leitura para Mega API:', megaApiPayload);
      console.log('📤 JID construído:', jid);
      console.log('📤 Phone do contato:', conversation.contacts.phone);
      console.log('🔗 URL da Mega API:', `${env.megaApi.host}/rest/chat/coruss-whatsapp-01/readChat`);
      console.log('🔑 Token da Mega API:', env.megaApi.token ? 'Presente' : 'Ausente');
      
      const megaApiResponse = await fetch(`${env.megaApi.host}/rest/chat/coruss-whatsapp-01/readChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.megaApi.token}`,
        },
        body: JSON.stringify(megaApiPayload)
      });

      const responseText = await megaApiResponse.text();
      console.log('📥 Resposta da Mega API:', responseText);

      if (megaApiResponse.ok) {
        console.log('✅ Confirmação de leitura enviada para Mega API');
      } else {
        console.error('❌ Erro ao enviar confirmação de leitura para Mega API:', responseText);
      }
    } catch (megaError) {
      console.error('❌ Erro na comunicação com Mega API:', megaError);
      // Não falhar a operação se a Mega API não responder
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conversa marcada como lida' 
    });

  } catch (error) {
    console.error('❌ Erro ao marcar conversa como lida:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
