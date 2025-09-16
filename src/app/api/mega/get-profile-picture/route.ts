// API para obter foto do perfil de qualquer usuário
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

    console.log('📸 Obtendo foto do perfil:', { instanceKey, phoneNumber });

    const response = await fetch(`${MEGA_HOST}/rest/instance/getProfilePicture/${instanceKey}?phone=${phoneNumber}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    if (!response.ok) {
      const errorResult = await response.json();
      console.error('❌ Erro da Mega API:', errorResult);
      return NextResponse.json(
        { error: errorResult.message || 'Erro ao obter foto do perfil' },
        { status: response.status }
      );
    }

    // Se a resposta for uma imagem, retornar como base64
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      console.log('✅ Foto do perfil obtida com sucesso');
      return NextResponse.json({
        success: true,
        message: 'Foto do perfil obtida com sucesso',
        data: {
          image: dataUrl,
          contentType: contentType
        }
      });
    } else {
      // Se não for imagem, retornar como JSON
      const result = await response.json();
      console.log('✅ Dados do perfil obtidos com sucesso');
      return NextResponse.json({
        success: true,
        message: 'Dados do perfil obtidos com sucesso',
        data: result
      });
    }

  } catch (error: any) {
    console.error('❌ Erro ao obter foto do perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
