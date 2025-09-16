// API para bloquear/desbloquear chat
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, block = true } = await request.json();

    if (!instanceKey || !chatId) {
      return NextResponse.json(
        { error: 'instanceKey e chatId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🚫 Bloqueando/Desbloqueando chat:', { instanceKey, chatId, block });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/blockChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        block: block
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao bloquear chat' },
        { status: response.status }
      );
    }

    console.log('✅ Chat bloqueado/desbloqueado com sucesso');
    return NextResponse.json({
      success: true,
      message: block ? 'Chat bloqueado com sucesso' : 'Chat desbloqueado com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao bloquear chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
