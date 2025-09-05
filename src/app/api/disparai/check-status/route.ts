import { NextRequest, NextResponse } from 'next/server';
import { createDisparaiAPIClient } from '@/lib/disparai-api';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 POST /api/disparai/check-status - Verificando status real da instância...');
    
    const { instanceKey, userId } = await req.json();
    
    if (!instanceKey || !userId) {
      return NextResponse.json({
        success: false,
        message: 'instanceKey e userId são obrigatórios'
      }, { status: 400 });
    }

    console.log('📊 Dados recebidos:', { instanceKey, userId });

    // Criar cliente DisparaiAPI
    const disparaiClient = createDisparaiAPIClient(
      instanceKey,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs'
    );

    // Verificar status da instância no servidor MegaAPI
    console.log('🔍 Verificando status no servidor MegaAPI...');
    const statusResponse = await disparaiClient.getInstanceStatus();
    
    console.log('📊 Status da instância:', statusResponse);

    if (statusResponse.error) {
      console.log('❌ Erro ao verificar status:', statusResponse.message);
      return NextResponse.json({
        success: false,
        message: statusResponse.message
      }, { status: 500 });
    }

    // Determinar status real baseado na resposta da API
    let realStatus = 'disconnected';
    let statusMessage = 'Desconectado';

    if (statusResponse.data && statusResponse.data.instance) {
      const instanceData = statusResponse.data.instance;
      
      if (instanceData.status === 'connected') {
        realStatus = 'connected';
        statusMessage = 'Conectado';
      } else if (instanceData.status === 'disconnected') {
        realStatus = 'disconnected';
        statusMessage = 'Desconectado';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: realStatus,
        statusMessage,
        instanceKey,
        lastChecked: new Date().toISOString(),
        rawData: statusResponse.data
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no endpoint /api/disparai/check-status:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
