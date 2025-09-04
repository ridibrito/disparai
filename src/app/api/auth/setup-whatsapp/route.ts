import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabaseServer';
import { createDisparaiAPIClient } from '@/lib/disparai-api';

const setupSchema = z.object({
  userId: z.string().min(1),
  instanceName: z.string().min(1),
  webhookUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = setupSchema.parse(body);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== validatedData.userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário já tem uma instância
    const { data: existingConnection } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp_disparai')
      .single();

    if (existingConnection) {
      return NextResponse.json({
        success: true,
        message: 'Usuário já possui uma instância WhatsApp',
        data: {
          connectionId: existingConnection.id,
          instanceKey: existingConnection.instance_id,
          status: existingConnection.status,
          hasInstance: true
        }
      });
    }

    // Criar instância no servidor Disparai
    const disparaiClient = createDisparaiAPIClient('temp_key', 'temp_token');
    const createResult = await disparaiClient.createInstance(
      validatedData.instanceName,
      validatedData.webhookUrl
    );

    if (createResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro ao criar instância no servidor Disparai',
          error: createResult.message 
        },
        { status: 500 }
      );
    }

    const instanceKey = createResult.data?.instance?.key || `INST_${user.id}_${Date.now()}`;
    const apiToken = createResult.data?.instance?.token || 'AUTO_GENERATED';

    // Salvar no banco de dados
    const { data: connection, error } = await supabase
      .from('api_connections')
      .insert({
        user_id: user.id,
        name: validatedData.instanceName,
        type: 'whatsapp_disparai',
        instance_id: instanceKey,
        api_key: apiToken,
        webhook_url: validatedData.webhookUrl,
        is_active: false,
        status: 'created',
        description: 'Instância criada automaticamente durante o registro',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar conexão:', error);
      return NextResponse.json(
        { success: false, message: 'Erro ao salvar conexão no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Instância WhatsApp criada com sucesso',
      data: {
        connectionId: connection.id,
        instanceKey,
        apiToken,
        status: 'created',
        qrCode: createResult.data?.qrCode || null,
        nextStep: createResult.data?.qrCode ? 'scan_qr' : 'connect_qr',
        hasInstance: false
      }
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

    console.error('POST /api/auth/setup-whatsapp error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
