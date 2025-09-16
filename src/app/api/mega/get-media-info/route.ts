// API para obter informações de mídia
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, messageId } = await request.json();

    if (!instanceKey || !messageId) {
      return NextResponse.json(
        { error: 'instanceKey e messageId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('ℹ️ Obtendo informações de mídia:', { instanceKey, messageId });

    const response = await fetch(`${MEGA_HOST}/rest/instance/getMediaInfo/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        messageId: messageId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao obter informações de mídia' },
        { status: response.status }
      );
    }

    console.log('✅ Informações de mídia obtidas');
    return NextResponse.json({
      success: true,
      message: 'Informações obtidas com sucesso',
      data: {
        messageId: messageId,
        mediaType: result.mediaType || 'unknown',
        fileName: result.fileName || 'media',
        fileSize: result.fileSize || 0,
        mimeType: result.mimeType || 'application/octet-stream',
        width: result.width,
        height: result.height,
        duration: result.duration,
        thumbnailUrl: result.thumbnailUrl
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter informações de mídia:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
