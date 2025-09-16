// API para arquivar/desarquivar chat
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, archive = true } = await request.json();

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

    console.log('📁 Arquivando/Desarquivando chat:', { instanceKey, chatId, archive });

    const response = await fetch(`${MEGA_HOST}/rest/chat/${instanceKey}/archiveChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        archive: archive
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao arquivar chat' },
        { status: response.status }
      );
    }

    console.log('✅ Chat arquivado/desarquivado com sucesso');
    return NextResponse.json({
      success: true,
      message: archive ? 'Chat arquivado com sucesso' : 'Chat desarquivado com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao arquivar chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
