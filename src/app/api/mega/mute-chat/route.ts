// API para silenciar/desilenciar chat
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, mute = true, time } = await request.json();

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

    console.log('🔇 Silenciando/Desilenciando chat:', { instanceKey, chatId, mute, time });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/muteChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        mute: mute,
        time: time
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao silenciar chat' },
        { status: response.status }
      );
    }

    console.log('✅ Chat silenciado/desilenciado com sucesso');
    return NextResponse.json({
      success: true,
      message: mute ? 'Chat silenciado com sucesso' : 'Chat desilenciado com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao silenciar chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
