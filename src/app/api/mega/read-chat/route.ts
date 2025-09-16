// API para marcar chat como lido/não lido
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, read = true } = await request.json();

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

    console.log('👁️ Marcando chat como lido/não lido:', { instanceKey, chatId, read });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/readChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        read: read
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao marcar chat como lido' },
        { status: response.status }
      );
    }

    console.log('✅ Chat marcado como lido/não lido com sucesso');
    return NextResponse.json({
      success: true,
      message: read ? 'Chat marcado como lido' : 'Chat marcado como não lido',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao marcar chat como lido:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
