// API para atualizar confirmação de leitura
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, enabled } = await request.json();

    if (!instanceKey || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'instanceKey e enabled são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🔒 Atualizando confirmação de leitura:', { instanceKey, enabled });

    const response = await fetch(`${MEGA_HOST}/rest/privacy/${instanceKey}/updateReadReceipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        value: enabled
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao atualizar confirmação de leitura' },
        { status: response.status }
      );
    }

    console.log('✅ Confirmação de leitura atualizada');
    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar confirmação de leitura:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
