import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { sendInteractive } from '@/lib/whatsapp';
import { processHandoffConfirmation } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message, contactPhone, connectionType = 'whatsapp_cloud' } = body;

    if (!conversationId || !message || !contactPhone) {
      return NextResponse.json({ 
        error: 'conversationId, message e contactPhone são obrigatórios' 
      }, { status: 400 });
    }

    // Processar a mensagem para detectar intenção de transferência
    const aiResult = await processHandoffConfirmation(message);

    if (aiResult.intent === 'handoff_confirmed') {
      // Transferir para humano
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          attendance_type: 'transferred',
          attendance_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Erro ao transferir conversa:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao transferir conversa' 
        }, { status: 500 });
      }

      // Enviar mensagem de confirmação
      await sendText(
        contactPhone,
        '✅ Perfeito! Sua conversa foi transferida para um atendente humano. Em breve você será atendido por um de nossos especialistas.',
        user.id,
        connectionType
      );

      // Disparar notificação para o usuário
      const event = new CustomEvent('conversationTransferredToHuman', {
        detail: {
          conversationId,
          message: 'Conversa transferida para atendimento humano',
          contactPhone
        }
      });
      
      // Em um ambiente real, você enviaria isso via WebSocket ou Server-Sent Events
      console.log('🔔 Notificação: Conversa transferida para humano', {
        conversationId,
        contactPhone
      });

      return NextResponse.json({
        success: true,
        message: 'Conversa transferida para atendimento humano',
        data: {
          conversationId,
          attendance_type: 'transferred',
          attendance_status: 'pending'
        }
      });

    } else if (aiResult.intent === 'handoff_cancelled') {
      // Cliente cancelou a transferência
      await sendText(
        contactPhone,
        aiResult.reply || 'Perfeito! Continuo aqui para te ajudar. Como posso te auxiliar?',
        user.id,
        connectionType
      );

      return NextResponse.json({
        success: true,
        message: 'Transferência cancelada pelo cliente',
        data: {
          conversationId,
          attendance_type: 'ai',
          attendance_status: 'in_progress'
        }
      });

    } else {
      // Pedir confirmação via botões
      await sendInteractive(
        contactPhone,
        'Entendi que você gostaria de falar com um atendente humano. Posso transferir sua conversa agora?',
        [
          { id: 'confirm_handoff', title: 'Sim, transferir' },
          { id: 'cancel_handoff', title: 'Não, continuar com IA' }
        ],
        user.id,
        connectionType
      );

      return NextResponse.json({
        success: true,
        message: 'Confirmação solicitada via botões',
        data: {
          conversationId,
          requires_confirmation: true
        }
      });
    }

  } catch (error) {
    console.error('Erro na API de handoff:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
