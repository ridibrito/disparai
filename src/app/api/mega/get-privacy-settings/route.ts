// API para obter configurações de privacidade
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey } = await request.json();

    if (!instanceKey) {
      return NextResponse.json(
        { error: 'instanceKey é obrigatório' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🔒 Obtendo configurações de privacidade:', { instanceKey });

    const response = await fetch(`${MEGA_HOST}/rest/privacy/${instanceKey}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao obter configurações de privacidade' },
        { status: response.status }
      );
    }

    console.log('✅ Configurações de privacidade obtidas');
    return NextResponse.json({
      success: true,
      message: 'Configurações obtidas com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter configurações:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
