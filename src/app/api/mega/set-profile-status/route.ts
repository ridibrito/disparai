// API para atualizar status do perfil WhatsApp
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, status } = await request.json();

    if (!instanceKey || !status) {
      return NextResponse.json(
        { error: 'instanceKey e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('📝 Atualizando status do perfil WhatsApp:', { instanceKey, status });

    const response = await fetch(`${MEGA_HOST}/rest/instance/setProfileStatus/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        status: status
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao atualizar status do perfil' },
        { status: response.status }
      );
    }

    console.log('✅ Status do perfil atualizado com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Status do perfil atualizado com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
