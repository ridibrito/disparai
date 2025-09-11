import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Configurando webhook na MegaAPI...');
    
    const body = await request.json();
    const { instanceKey, webhookUrl } = body;

    if (!instanceKey || !webhookUrl) {
      return NextResponse.json({ 
        error: 'instanceKey e webhookUrl são obrigatórios' 
      }, { status: 400 });
    }

    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    console.log('📡 Configurando webhook na MegaAPI:', {
      instanceKey,
      webhookUrl,
      host
    });

    // Tentar configurar webhook na MegaAPI
    const response = await fetch(`${host}/rest/webhook/${instanceKey}/configWebhook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageData: {
          webhookUrl: webhookUrl,
          webhookEnabled: true
        }
      })
    });

    console.log('📡 Resposta da MegaAPI:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao configurar webhook na MegaAPI:', errorText);
      
      return NextResponse.json({ 
        error: 'Erro ao configurar webhook na MegaAPI',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Webhook configurado com sucesso na MegaAPI:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook configurado com sucesso na MegaAPI',
      result
    });

  } catch (error) {
    console.error('❌ Erro ao configurar webhook na MegaAPI:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
