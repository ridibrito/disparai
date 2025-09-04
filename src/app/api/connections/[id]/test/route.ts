import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import axios from 'axios';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar conexão
    const { data: connection, error } = await supabase
      .from('api_connections')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    let testResult;

    if (connection.type === 'whatsapp_cloud') {
      // Testar WhatsApp Cloud API
      testResult = await testWhatsAppCloudConnection(connection);
    } else if (connection.type === 'whatsapp_disparai') {
      // Testar WhatsApp Disparai
      testResult = await testWhatsAppDisparaiConnection(connection);
    } else {
      return NextResponse.json({ error: 'Tipo de conexão não suportado' }, { status: 400 });
    }

    // Atualizar status da conexão
    await supabase
      .from('api_connections')
      .update({
        status: testResult.success ? 'active' : 'error',
        last_tested_at: new Date().toISOString(),
        error_message: testResult.success ? null : testResult.error,
      })
      .eq('id', params.id);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
    });
  } catch (error) {
    console.error('POST /api/connections/[id]/test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testWhatsAppCloudConnection(connection: any) {
  try {
    // Testar se conseguimos acessar a API do WhatsApp Cloud
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${connection.phone_number}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.api_key}`,
        },
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        message: 'Conexão WhatsApp Cloud API testada com sucesso!',
        details: {
          phoneNumber: connection.phone_number,
          status: 'active',
          verified: true,
        },
      };
    } else {
      return {
        success: false,
        message: 'Falha na conexão com WhatsApp Cloud API',
        error: `Status: ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao testar conexão WhatsApp Cloud API',
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

async function testWhatsAppDisparaiConnection(connection: any) {
  try {
    // Testar se conseguimos acessar a API do WhatsApp Disparai
    const response = await axios.get(
      `https://api.disparai.com/instance/status/${connection.instance_id}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.api_key}`,
        },
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        message: 'Conexão WhatsApp Disparai testada com sucesso!',
        details: {
          instanceId: connection.instance_id,
          status: response.data.status || 'active',
          verified: true,
        },
      };
    } else {
      return {
        success: false,
        message: 'Falha na conexão com WhatsApp Disparai',
        error: `Status: ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao testar conexão WhatsApp Disparai',
      error: error.response?.data?.error?.message || error.message,
    };
  }
}
