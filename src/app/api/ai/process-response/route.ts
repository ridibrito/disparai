import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';
import { generateAgentResponse } from '@/lib/ai-service';
import { AIAgent, ConversationContext } from '@/types/ai-agents';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, messageId } = await request.json();
    
    console.log('🤖 API de processamento de IA chamada:', { conversationId, messageId });

    if (!conversationId || !messageId) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'conversationId e messageId são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServerClientWithServiceRole();
    console.log('🔧 Cliente Supabase criado com service role');

    // 1. Buscar a mensagem e conversa
    console.log('🔍 Buscando mensagem e conversa...');
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        conversations (
          *,
          contacts (*)
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      console.error('Erro ao buscar mensagem:', messageError);
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    const conversation = message.conversations;
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar a instância WhatsApp
    console.log('🔍 Buscando instância WhatsApp...');
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', conversation.organization_id)
      .eq('status', 'ativo')
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('Erro ao buscar instância WhatsApp:', instanceError);
      return NextResponse.json(
        { error: 'Instância WhatsApp não encontrada' },
        { status: 404 }
      );
    }

    // 2. Verificar se a mensagem é do usuário (não do sistema)
    if (message.sender_type === 'system') {
      return NextResponse.json(
        { message: 'Mensagem do sistema, não processando' },
        { status: 200 }
      );
    }

    // 3. Buscar configuração de agente para esta instância
    console.log('🔍 Buscando agente configurado...');
    const { data: agentConfig, error: configError } = await supabase
      .from('agent_instance_configs')
      .select(`
        *,
        ai_agents (*)
      `)
      .eq('whatsapp_instance_id', whatsappInstance.id)
      .eq('is_enabled', true)
      .single();

    if (configError || !agentConfig) {
      console.log('❌ Nenhum agente configurado para esta instância:', configError);
      return NextResponse.json(
        { message: 'Nenhum agente configurado' },
        { status: 200 }
      );
    }

    console.log('✅ Agente configurado encontrado:', agentConfig.ai_agents?.name);

    const agent = agentConfig.ai_agents as AIAgent;
    if (!agent || !agent.is_active) {
      return NextResponse.json(
        { message: 'Agente inativo' },
        { status: 200 }
      );
    }

    // 4. Buscar histórico da conversa
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Últimas 20 mensagens

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico da conversa' },
        { status: 500 }
      );
    }

    // 5. Construir contexto para o agente
    const context: ConversationContext = {
      conversation_id: conversationId,
      contact_name: conversation.contacts?.name || 'Cliente',
      contact_phone: conversation.contacts?.phone || '',
      message_history: messageHistory.map(msg => ({
        role: msg.sender_type === 'system' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.created_at
      })),
      last_message: message.content,
      agent_type: agent.type,
      organization_info: {
        name: 'Sua Empresa', // TODO: Buscar da tabela organizations
        industry: 'Tecnologia', // TODO: Buscar da tabela organizations
        products: ['Produto A', 'Produto B'] // TODO: Buscar da tabela organizations
      }
    };

    // 6. Gerar resposta do agente
    console.log('🤖 Gerando resposta do agente:', agent.name);
    const aiResponse = await generateAgentResponse(agent, context);

    // 7. Salvar resposta do agente no histórico
    const { data: agentResponseRecord, error: saveError } = await supabase
      .from('agent_responses')
      .insert({
        organization_id: conversation.organization_id,
        conversation_id: conversationId,
        agent_id: agent.id,
        message_id: messageId,
        user_message: message.content,
        agent_response: aiResponse.response,
        response_time_ms: aiResponse.response_time_ms,
        tokens_used: aiResponse.tokens_used
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar resposta do agente:', saveError);
    }

    // 8. Se deve escalar para humano, enviar confirmação com botões
    if (aiResponse.should_escalate) {
      console.log('⚠️ Escalando para humano:', aiResponse.escalation_reason);
      
      try {
        // Enviar mensagem de confirmação com botões
        const whatsappResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/send-interactive`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              body: 'Entendi que você gostaria de falar com um atendente humano. Posso transferir sua conversa agora?',
              buttons: [
                { id: 'confirm_handoff', title: 'Sim, transferir' },
                { id: 'cancel_handoff', title: 'Não, continuar com IA' }
              ]
            }),
          }
        );

        if (!whatsappResponse.ok) {
          console.error('Erro ao enviar botões de confirmação');
          // Fallback para texto simples
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/messages`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: 'Entendi que você gostaria de falar com um atendente humano. Posso transferir sua conversa? Responda "sim" para confirmar.',
                sender_type: 'system'
              }),
            }
          );
        } else {
          console.log('✅ Botões de confirmação enviados com sucesso');
        }
      } catch (error) {
        console.error('Erro ao enviar confirmação de escalação:', error);
      }
    }

    // 9. Enviar resposta via WhatsApp (se não escalar)
    if (!aiResponse.should_escalate) {
      try {
        // Enviar mensagem via API do WhatsApp
        const whatsappResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: aiResponse.response,
              sender_type: 'system'
            }),
          }
        );

        if (!whatsappResponse.ok) {
          console.error('Erro ao enviar mensagem via WhatsApp');
        } else {
          console.log('✅ Resposta do agente enviada com sucesso');
        }
      } catch (error) {
        console.error('Erro ao enviar resposta do agente:', error);
      }
    }

    return NextResponse.json({
      success: true,
      agent_response: aiResponse.response,
      should_escalate: aiResponse.should_escalate,
      escalation_reason: aiResponse.escalation_reason,
      tokens_used: aiResponse.tokens_used,
      response_time_ms: aiResponse.response_time_ms
    });

  } catch (error) {
    console.error('Erro ao processar resposta do agente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
