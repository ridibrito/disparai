// API para definir etiquetas de um chat
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId, labelIds } = await request.json();

    if (!instanceKey || !chatId || !Array.isArray(labelIds)) {
      return NextResponse.json(
        { error: 'instanceKey, chatId e labelIds são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🏷️ Definindo etiquetas do chat:', { instanceKey, chatId, labelIds });

    const response = await fetch(`${MEGA_HOST}/rest/instance/labels/setChatLabels/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        chatId: chatId,
        labelIds: labelIds
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao definir etiquetas do chat' },
        { status: response.status }
      );
    }

    console.log('✅ Etiquetas do chat definidas com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Etiquetas do chat definidas com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao definir etiquetas do chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
