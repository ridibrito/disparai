import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabaseServer';
import { createDisparaiAPIClient } from '@/lib/disparai-api';

const createInstanceSchema = z.object({
  userId: z.string().min(1),
  instanceName: z.string().min(1),
});

const deleteInstanceSchema = z.object({
  userId: z.string().min(1),
  instanceKey: z.string().min(1),
});

// Criar nova instância
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createInstanceSchema.parse(body);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== validatedData.userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Criar instância no servidor Disparai
    const disparaiClient = createDisparaiAPIClient('temp_key', 'temp_token');
    const createResult = await disparaiClient.createInstance(
      validatedData.instanceName
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
    
    const instanceData = {
      instanceKey,
      instanceName: validatedData.instanceName,
      userId: user.id,
      status: 'created',
      qrCode: createResult.data?.qrCode || null,
      createdAt: new Date().toISOString(),
    };

    // Salvar no banco de dados
    const { data: connection, error } = await supabase
      .from('api_connections')
      .insert({
        user_id: user.id,
        name: validatedData.instanceName,
        type: 'whatsapp_disparai',
        instance_id: instanceKey,
        api_key: apiToken,
        is_active: false,
        status: 'created',
        description: 'Instância criada automaticamente',
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
      message: 'Instância criada com sucesso',
      data: {
        connectionId: connection.id,
        instanceKey,
        apiToken,
        status: 'created',
        qrCode: instanceData.qrCode,
        nextStep: instanceData.qrCode ? 'scan_qr' : 'connect_qr'
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

    console.error('POST /api/disparai/instance error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Obter QR Code para conectar
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instanceKey = searchParams.get('instanceKey');
    const userId = searchParams.get('userId');

    if (!instanceKey || !userId) {
      return NextResponse.json(
        { success: false, message: 'Instance Key e User ID são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Buscar conexão no banco
    const { data: connection, error } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('instance_id', instanceKey)
      .single();

    if (error || !connection) {
      return NextResponse.json(
        { success: false, message: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    // Gerar QR Code no servidor Disparai
    const disparaiClient = createDisparaiAPIClient(instanceKey, connection.api_key);
    const qrResult = await disparaiClient.generateQRCode();

    if (qrResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro ao gerar QR Code',
          error: qrResult.message 
        },
        { status: 500 }
      );
    }

    const qrCodeData = {
      qrCode: qrResult.data?.qrCode || qrResult.data?.qr,
      status: 'waiting_qr',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
    };

    // Atualizar status da conexão
    await supabase
      .from('api_connections')
      .update({
        status: 'waiting_qr',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return NextResponse.json({
      success: true,
      message: 'QR Code gerado com sucesso',
      data: qrCodeData
    });

  } catch (error) {
    console.error('GET /api/disparai/instance error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Deletar instância
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = deleteInstanceSchema.parse(body);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== validatedData.userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Buscar e deletar conexão
    const { error } = await supabase
      .from('api_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('instance_id', validatedData.instanceKey);

    if (error) {
      console.error('Erro ao deletar conexão:', error);
      return NextResponse.json(
        { success: false, message: 'Erro ao deletar instância' },
        { status: 500 }
      );
    }

    // Aqui você faria a chamada para o servidor Disparai para deletar a instância
    // Por enquanto, vamos simular

    return NextResponse.json({
      success: true,
      message: 'Instância deletada com sucesso'
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

    console.error('DELETE /api/disparai/instance error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
