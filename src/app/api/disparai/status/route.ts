import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabaseServer';
import { createDisparaiAPIClient } from '@/lib/disparai-api';

const statusSchema = z.object({
  instanceKey: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = statusSchema.parse(body);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== validatedData.userId) {
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
      .eq('instance_id', validatedData.instanceKey)
      .single();

    if (error || !connection) {
      return NextResponse.json(
        { success: false, message: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    // Se a conexão já tem API key, verificar status no servidor
    if (connection.api_key && connection.api_key !== 'AUTO_GENERATED') {
      try {
        const disparaiClient = createDisparaiAPIClient(
          validatedData.instanceKey,
          connection.api_key
        );

        const statusResult = await disparaiClient.getInstanceStatus();

        if (statusResult.error === false && statusResult.data?.instance?.status === 'connected') {
          // Atualizar status no banco
          await supabase
            .from('api_connections')
            .update({
              status: 'connected',
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);

          return NextResponse.json({
            success: true,
            message: 'Instância conectada com sucesso',
            data: {
              status: 'connected',
              instanceKey: validatedData.instanceKey,
              user: statusResult.data.instance.user,
              connectedAt: new Date().toISOString()
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            message: 'Aguardando conexão',
            data: {
              status: 'waiting_connection',
              instanceKey: validatedData.instanceKey,
              message: 'Escaneie o QR Code para conectar'
            }
          });
        }
      } catch (apiError) {
        console.error('Erro ao verificar status no servidor:', apiError);
        return NextResponse.json({
          success: true,
          message: 'Aguardando conexão',
          data: {
            status: 'waiting_connection',
            instanceKey: validatedData.instanceKey,
            message: 'Escaneie o QR Code para conectar'
          }
        });
      }
    }

    // Se ainda não tem API key, está aguardando QR Code
    return NextResponse.json({
      success: true,
      message: 'Aguardando QR Code',
      data: {
        status: 'waiting_qr',
        instanceKey: validatedData.instanceKey,
        message: 'QR Code será gerado em breve'
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

    console.error('POST /api/disparai/status error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
