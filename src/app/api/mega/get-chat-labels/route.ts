// API para obter etiquetas de um chat específico
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, chatId } = await request.json();

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

    console.log('🏷️ Obtendo etiquetas do chat:', { instanceKey, chatId });

    const response = await fetch(`${MEGA_HOST}/rest/instance/labels/getChatLabels/${instanceKey}?chatId=${chatId}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao obter etiquetas do chat' },
        { status: response.status }
      );
    }

    console.log('✅ Etiquetas do chat obtidas com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Etiquetas do chat obtidas com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter etiquetas do chat:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
