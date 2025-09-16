// API para fixar/desfixar chat
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, pin = true } = await request.json();

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

    console.log('📌 Fixando/Desfixando chat:', { instanceKey, chatId, pin });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/pinChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        pin: pin
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao fixar chat' },
        { status: response.status }
      );
    }

    console.log('✅ Chat fixado/desfixado com sucesso');
    return NextResponse.json({
      success: true,
      message: pin ? 'Chat fixado com sucesso' : 'Chat desfixado com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao fixar chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
