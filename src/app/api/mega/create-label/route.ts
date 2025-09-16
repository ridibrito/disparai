// API para criar nova etiqueta
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, name, color } = await request.json();

    if (!instanceKey || !name) {
      return NextResponse.json(
        { error: 'instanceKey e name são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('➕ Criando etiqueta:', { instanceKey, name, color });

    const response = await fetch(`${MEGA_HOST}/rest/instance/labels/createLabel/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        name: name,
        color: color || '#FF6B6B'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao criar etiqueta' },
        { status: response.status }
      );
    }

    console.log('✅ Etiqueta criada com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Etiqueta criada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar etiqueta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
