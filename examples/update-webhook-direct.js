// Script para atualizar webhook URL diretamente no banco
// Execute: node examples/update-webhook-direct.js

const axios = require('axios');

async function updateWebhookDirect() {
  try {
    console.log('🔧 Atualizando webhook URL diretamente...\n');
    
    // Usar o endpoint de migração de webhooks
    const migrateUrl = 'http://localhost:3000/api/migrate-webhooks';
    
    console.log('📤 Chamando endpoint de migração...');
    
    const response = await axios.post(migrateUrl, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta da migração:', JSON.stringify(response.data, null, 2));
    
    // Agora vamos atualizar manualmente para o ngrok
    console.log('\n🔧 Atualizando para URL do ngrok...');
    
    const updateUrl = 'http://localhost:3000/api/update-instance-status';
    
    const updatePayload = {
      instanceKey: 'coruss-whatsapp-01',
      status: 'active',
      webhookUrl: 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook'
    };
    
    const updateResponse = await axios.post(updateUrl, updatePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta da atualização:', JSON.stringify(updateResponse.data, null, 2));
    
    // Testar webhook novamente
    console.log('\n🧪 Testando webhook após atualização...');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    const messagePayload = {
      instanceKey: 'coruss-whatsapp-01',
      type: 'message',
      data: {
        from: '5511999999999',
        message: 'Teste final após atualização',
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
updateWebhookDirect();
