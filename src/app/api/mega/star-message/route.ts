// API para favoritar/desfavoritar mensagem
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, messageId, star = true } = await request.json();

    if (!instanceKey || !chatId || !messageId) {
      return NextResponse.json(
        { error: 'instanceKey, chatId e messageId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('⭐ Favoritando/Desfavoritando mensagem:', { instanceKey, chatId, messageId, star });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/starMessageChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        messageId: messageId,
        star: star
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao favoritar mensagem' },
        { status: response.status }
      );
    }

    console.log('✅ Mensagem favoritada/desfavoritada com sucesso');
    return NextResponse.json({
      success: true,
      message: star ? 'Mensagem favoritada com sucesso' : 'Mensagem desfavoritada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao favoritar mensagem:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
