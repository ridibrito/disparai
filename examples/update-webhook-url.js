// Script para atualizar o webhook URL da instância
// Execute: node examples/update-webhook-url.js

const axios = require('axios');

async function updateWebhookUrl() {
  try {
    console.log('🔧 Atualizando webhook URL da instância...\n');
    
    const updateUrl = 'http://localhost:3000/api/update-instance-webhook';
    
    const payload = {
      instanceKey: 'coruss-whatsapp-01',
      webhookUrl: 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook'
    };
    
    console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(updateUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta da atualização:', JSON.stringify(response.data, null, 2));
    
    // Testar webhook novamente
    console.log('\n🧪 Testando webhook após atualização...');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    const messagePayload = {
      instanceKey: 'coruss-whatsapp-01',
      type: 'message',
      data: {
        from: '5511999999999',
        message: 'Teste após atualização do webhook',
        timestamp: new Date().toISOString(),
        messageId: 'test_' + Date.now()
      }
    };
    
    const webhookResponse = await axios.post(webhookUrl, messagePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta do webhook:', webhookResponse.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar
updateWebhookUrl();
