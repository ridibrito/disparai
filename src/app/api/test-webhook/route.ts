import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 API de teste de webhook chamada - INÍCIO');
    
    const body = await request.json();
    console.log('📦 Dados recebidos:', body);
    
    const { instanceKey, testMessage } = body;

    if (!instanceKey) {
      console.log('❌ instanceKey não fornecido');
      return NextResponse.json({ error: 'instanceKey é obrigatório' }, { status: 400 });
    }

    console.log('✅ instanceKey válido:', instanceKey);

    // Simular uma mensagem recebida para teste
    const mockWebhookData = {
      type: 'message',
      instance: instanceKey,
      from: '5511999999999', // Número de teste
      message: {
        text: testMessage || 'Mensagem de teste do webhook',
        type: 'text',
        id: `test_${Date.now()}`
      }
    };

    console.log('📨 Dados do webhook simulado:', mockWebhookData);

    // Chamar o webhook de mensagens
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/whatsapp-messages`;
    
    console.log('🔗 Chamando webhook de mensagens:', webhookUrl);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockWebhookData)
    });

    console.log('📡 Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook testado com sucesso:', result);
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook testado com sucesso! Verifique as conversas.',
        result,
        mockData: mockWebhookData
      });
    } else {
      const errorData = await response.json();
      console.error('❌ Erro ao testar webhook:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao testar webhook: ' + (errorData.error || response.statusText),
        details: errorData
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}