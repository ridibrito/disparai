// API para enviar mensagem com botões
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, to, body, buttons } = await request.json();

    if (!instanceKey || !to || !body || !buttons) {
      return NextResponse.json(
        { error: 'instanceKey, to, body e buttons são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🔘 Enviando mensagem com botões:', { instanceKey, to, body, buttons });

    const response = await fetch(`${MEGA_HOST}/rest/instance/buttonMessage/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        to: to,
        body: body,
        buttons: buttons
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao enviar mensagem com botões' },
        { status: response.status }
      );
    }

    console.log('✅ Mensagem com botões enviada');
    return NextResponse.json({
      success: true,
      message: 'Mensagem com botões enviada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem com botões:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
