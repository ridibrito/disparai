import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabaseServer';
import { createDisparaiAPIClient } from '@/lib/disparai-api';

const autoSetupSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 POST /api/auth/auto-setup - Iniciando...');
    
    const body = await req.json();
    console.log('📝 Body recebido:', body);
    
    const validatedData = autoSetupSchema.parse(body);
    console.log('✅ Dados validados:', validatedData);

    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
      return NextResponse.json(
        { success: false, message: 'Erro de autenticação', error: userError.message },
        { status: 401 }
      );
    }
    
    console.log('👤 Usuário obtido:', user?.id);

    if (!user || user.id !== validatedData.userId) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Buscar organization_id do usuário
    console.log('🏢 Buscando organização do usuário...');
    const { data: userOrg, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (orgError) {
      console.error('❌ Erro ao buscar organização:', orgError);
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar organização do usuário', error: orgError.message },
        { status: 500 }
      );
    }

    const organizationId = userOrg?.organization_id;
    console.log('🏢 Organization ID:', organizationId);

    // Verificar se o usuário já tem uma instância
    console.log('🔍 Verificando conexões existentes para usuário:', user.id);
    const { data: existingConnection, error: existingError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp_disparai')
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar conexões existentes:', existingError);
      return NextResponse.json(
        { success: false, message: 'Erro ao verificar conexões existentes', error: existingError.message },
        { status: 500 }
      );
    }
    
    console.log('📊 Conexão existente:', existingConnection);

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

    // Criar instância automaticamente no servidor Disparai
    const instanceName = `${validatedData.userName} - WhatsApp`;
    const disparaiClient = createDisparaiAPIClient('disparai', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs');
    const createResult = await disparaiClient.createInstance(instanceName);

    if (createResult.error) {
      // Se não conseguir criar no servidor, tentar obter QR code da instância existente "disparai"
      console.log('Servidor Disparai não disponível, tentando usar instância existente "disparai"');
      
      try {
        // Tentar obter QR code da instância "disparai" que já existe
        const qrResult = await disparaiClient.getQRCode('disparai');
        
        if (qrResult.error) {
          console.log('Não foi possível obter QR code da instância existente');
          return NextResponse.json({
            success: false,
            message: 'Servidor Disparai temporariamente indisponível. Tente novamente em alguns minutos.',
            error: 'SERVER_UNAVAILABLE'
          }, { status: 503 });
        }

        // Salvar conexão usando a instância existente
        const { data: connection, error } = await supabase
          .from('api_connections')
          .insert({
            user_id: user.id,
            organization_id: organizationId,
            name: instanceName,
            type: 'whatsapp_disparai',
            instance_id: 'disparai',
            api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            api_secret: 'disparai_token',
            is_active: false,
            status: 'pending_qr',
            description: 'Instância criada usando servidor existente',
            provider: 'disparai'
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
          message: 'QR Code gerado com sucesso',
          data: {
            connectionId: connection.id,
            instanceKey: 'disparai',
            apiToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            status: 'pending_qr',
            qrCode: qrResult.data?.qrCode || null,
            nextStep: qrResult.data?.qrCode ? 'scan_qr' : 'connect_qr',
            hasInstance: true
          }
        });

      } catch (qrError) {
        console.error('Erro ao obter QR code:', qrError);
        return NextResponse.json({
          success: false,
          message: 'Servidor Disparai temporariamente indisponível. Tente novamente em alguns minutos.',
          error: 'QR_GENERATION_FAILED'
        }, { status: 503 });
      }
    }

    const instanceKey = createResult.data?.instance?.key || `INST_${user.id}_${Date.now()}`;
    const apiToken = createResult.data?.instance?.token || 'AUTO_GENERATED';

    // Salvar no banco de dados
    const { data: connection, error } = await supabase
      .from('api_connections')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        name: instanceName,
        type: 'whatsapp_disparai',
        instance_id: instanceKey,
        api_key: apiToken,
        api_secret: 'auto_generated',
        is_active: false,
        status: 'created',
        description: 'Instância criada automaticamente durante o registro',
        provider: 'disparai'
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
      message: 'Instância WhatsApp criada automaticamente',
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

    console.error('POST /api/auth/auto-setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
