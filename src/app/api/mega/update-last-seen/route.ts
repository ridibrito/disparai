// API para atualizar configuração de última vez visto
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, setting } = await request.json();

    if (!instanceKey || !setting) {
      return NextResponse.json(
        { error: 'instanceKey e setting são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🔒 Atualizando última vez visto:', { instanceKey, setting });

    const response = await fetch(`${MEGA_HOST}/rest/privacy/${instanceKey}/updateLastSeen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        value: setting
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao atualizar última vez visto' },
        { status: response.status }
      );
    }

    console.log('✅ Última vez visto atualizada');
    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar última vez visto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
