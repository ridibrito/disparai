// API para verificar se número está no WhatsApp
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, phoneNumber } = await request.json();

    if (!instanceKey || !phoneNumber) {
      return NextResponse.json(
        { error: 'instanceKey e phoneNumber são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('🔍 Verificando se número está no WhatsApp:', { instanceKey, phoneNumber });

    const response = await fetch(`${MEGA_HOST}/rest/instance/isOnWhatsApp/${instanceKey}?phone=${phoneNumber}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao verificar número' },
        { status: response.status }
      );
    }

    console.log('✅ Verificação concluída');
    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar número:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
