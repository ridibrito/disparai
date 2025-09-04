import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  validateWhatsAppCloudCredentials, 
  validateWhatsAppDisparaiCredentials
} from '@/lib/connection-validation';

const validationSchema = z.object({
  type: z.enum(['whatsapp_cloud', 'whatsapp_disparai']),
  phoneNumber: z.string().optional(),
  instanceKey: z.string().optional(),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = validationSchema.parse(body);

    let result;

    if (validatedData.type === 'whatsapp_cloud') {
      // Validar credenciais do WhatsApp Cloud API
      result = await validateWhatsAppCloudCredentials(
        validatedData.phoneNumber || '',
        validatedData.apiKey
      );
    } else if (validatedData.type === 'whatsapp_disparai') {
      // Validar credenciais da API Disparai
      result = await validateWhatsAppDisparaiCredentials(
        validatedData.instanceKey || '',
        validatedData.apiKey
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Tipo de conexão não suportado' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
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
    
    console.error('POST /api/connections/validate error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
