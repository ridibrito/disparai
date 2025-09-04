import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDisparaiAPIClient, formatPhoneToE164 } from '@/lib/disparai-api';

const sendMessageSchema = z.object({
  instanceKey: z.string().min(1),
  apiToken: z.string().min(1),
  to: z.string().min(1),
  message: z.string().min(1),
  messageType: z.enum(['text', 'media']).optional().default('text'),
  mediaType: z.enum(['image', 'audio', 'video', 'document']).optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = sendMessageSchema.parse(body);

    // Criar cliente API Disparai
    const disparaiAPIClient = createDisparaiAPIClient(
      validatedData.instanceKey,
      validatedData.apiToken
    );

    // Formatar número de telefone para E164
    const formattedPhone = formatPhoneToE164(validatedData.to);

    let result;

    if (validatedData.messageType === 'media' && validatedData.mediaType && validatedData.mediaUrl) {
      // Enviar mídia
      result = await disparaiAPIClient.sendMediaMessage(
        formattedPhone,
        validatedData.mediaType,
        validatedData.mediaUrl,
        validatedData.caption
      );
    } else {
      // Enviar texto
      result = await disparaiAPIClient.sendTextMessage(formattedPhone, validatedData.message);
    }

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.data
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: result.data
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('POST /api/disparai/send error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
