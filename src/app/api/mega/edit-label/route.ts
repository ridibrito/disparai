// API para editar/deletar etiqueta
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, labelId, name, color, delete: deleteLabel } = await request.json();

    if (!instanceKey || !labelId) {
      return NextResponse.json(
        { error: 'instanceKey e labelId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('✏️ Editando etiqueta:', { instanceKey, labelId, name, color, deleteLabel });

    const response = await fetch(`${MEGA_HOST}/rest/instance/labels/editLabel/${instanceKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MEGA_TOKEN,
      },
      body: JSON.stringify({
        labelId: labelId,
        name: name,
        color: color,
        delete: deleteLabel || false
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao editar etiqueta' },
        { status: response.status }
      );
    }

    console.log('✅ Etiqueta editada com sucesso');
    return NextResponse.json({
      success: true,
      message: deleteLabel ? 'Etiqueta deletada com sucesso' : 'Etiqueta editada com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao editar etiqueta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
