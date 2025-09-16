// API para enviar enquete
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, to, name, options, selectableCount } = await request.json();

    if (!instanceKey || !to || !name || !options || !selectableCount) {
      return NextResponse.json(
        { error: 'instanceKey, to, name, options e selectableCount são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('📊 Enviando enquete:', { instanceKey, to, name, options, selectableCount });

    const response = await fetch(`${MEGA_HOST}/rest/instance/pollMessage/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        to: to,
        name: name,
        options: options,
        selectableCount: selectableCount
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao enviar enquete' },
        { status: response.status }
      );
    }

    console.log('✅ Enquete enviada');
    return NextResponse.json({
      success: true,
      message: 'Enquete enviada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar enquete:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
