// API para atualizar modo de mensagens temporárias
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, enabled, time } = await request.json();

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

    console.log('🔒 Atualizando modo temporário:', { instanceKey, enabled, time });

    const response = await fetch(`${MEGA_HOST}/rest/privacy/${instanceKey}/disappearingMode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        enabled: enabled,
        time: time || 86400 // 24 horas por padrão
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao atualizar modo temporário' },
        { status: response.status }
      );
    }

    console.log('✅ Modo temporário atualizado');
    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar modo temporário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
