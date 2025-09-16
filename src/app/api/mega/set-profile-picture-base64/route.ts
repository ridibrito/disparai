// API para atualizar foto do perfil WhatsApp via Base64
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, pictureBase64 } = await request.json();

    if (!instanceKey || !pictureBase64) {
      return NextResponse.json(
        { error: 'instanceKey e pictureBase64 são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('📝 Atualizando foto do perfil WhatsApp (Base64)');

    const response = await fetch(`${MEGA_HOST}/rest/instance/setProfilePictureBase64/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        base64: pictureBase64
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao atualizar foto do perfil' },
        { status: response.status }
      );
    }

    console.log('✅ Foto do perfil atualizada com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Foto do perfil atualizada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar foto do perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
