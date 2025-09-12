// Teste para simular uma mensagem real da Mega API
// Execute: node examples/test-webhook-message.js

const axios = require('axios');

async function testWebhookMessage() {
  try {
    console.log('🧪 Testando webhook com mensagem simulada...\n');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    
    // Simular payload de mensagem da Mega API
    const messagePayload = {
      instanceKey: 'coruss-whatsapp-01',
      type: 'message',
      data: {
        from: '5511999999999',
        message: 'Teste de mensagem via webhook',
        timestamp: new Date().toISOString(),
        messageId: 'test_' + Date.now()
      }
    };
    
    console.log('📤 Enviando payload:', JSON.stringify(messagePayload, null, 2));
    
    const response = await axios.post(webhookUrl, messagePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta do webhook:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.response?.data || error.message);
  }
}

// Executar teste
testWebhookMessage();
