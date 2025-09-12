// Script para criar a instância coruss-whatsapp-01 no banco de dados local
// Execute: node examples/create-coruss-instance.js

const axios = require('axios');

async function createCorussInstance() {
  try {
    console.log('🔧 Criando instância coruss-whatsapp-01 no banco local...\n');
    
    const createUrl = 'http://localhost:3000/api/create-whatsapp-instance';
    
    const payload = {
      instanceName: 'coruss-whatsapp-01',
      organizationId: '596274e5-69c9-4267-975d-18f6af63c9b2', // ID padrão do projeto
      webhookUrl: 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook'
    };
    
    console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(createUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta da criação:', JSON.stringify(response.data, null, 2));
    
    // Agora testar o webhook novamente
    console.log('\n🧪 Testando webhook após criação...');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    const messagePayload = {
      instanceKey: 'coruss-whatsapp-01',
      type: 'message',
      data: {
        from: '5511999999999',
        message: 'Teste após criação da instância',
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
createCorussInstance();
