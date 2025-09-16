// API para validar se número está no WhatsApp
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

    console.log('📱 Validando número WhatsApp:', { instanceKey, phoneNumber });

    const response = await fetch(`${MEGA_HOST}/rest/instance/isOnWhatsApp/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        phone: phoneNumber
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao validar número' },
        { status: response.status }
      );
    }

    console.log('✅ Número validado');
    return NextResponse.json({
      success: true,
      message: 'Número validado com sucesso',
      data: {
        number: phoneNumber,
        isOnWhatsApp: result.isOnWhatsApp || false,
        isBusiness: result.isBusiness || false,
        profileName: result.profileName,
        profilePicture: result.profilePicture,
        lastSeen: result.lastSeen
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao validar número:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
