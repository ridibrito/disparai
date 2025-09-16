// API para enviar mensagem template
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, to, templateName, language, components } = await request.json();

    if (!instanceKey || !to || !templateName || !language) {
      return NextResponse.json(
        { error: 'instanceKey, to, templateName e language são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('📄 Enviando mensagem template:', { instanceKey, to, templateName, language, components });

    const response = await fetch(`${MEGA_HOST}/rest/instance/templateMessage/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        to: to,
        templateName: templateName,
        language: language,
        components: components || []
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao enviar mensagem template' },
        { status: response.status }
      );
    }

    console.log('✅ Mensagem template enviada');
    return NextResponse.json({
      success: true,
      message: 'Mensagem template enviada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem template:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
