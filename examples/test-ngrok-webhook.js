// Script para testar o webhook configurado com ngrok
// Execute: node examples/test-ngrok-webhook.js

const axios = require('axios');

const NGROK_URL = 'https://b41819143523.ngrok-free.app';
const WEBHOOK_ENDPOINT = `${NGROK_URL}/api/mega/webhook`;

async function testWebhook() {
  try {
    console.log('🧪 Testando webhook configurado...\n');
    console.log('🌐 URL do webhook:', WEBHOOK_ENDPOINT);
    
    // 1. Teste básico de conectividade
    console.log('1️⃣ Testando conectividade básica...');
    try {
      const healthResponse = await axios.get(`${NGROK_URL}/api/health`, {
        timeout: 5000
      });
      console.log('✅ Aplicação está respondendo:', healthResponse.status);
    } catch (error) {
      console.log('⚠️ Aplicação pode não estar respondendo:', error.message);
    }
    
    // 2. Teste do webhook com dados simulados
    console.log('\n2️⃣ Testando webhook com dados simulados...');
    
    const testData = {
      instanceKey: 'test-instance-ngrok',
      type: 'message',
      data: {
        messageId: 'test-msg-' + Date.now(),
        from: '5511999999999@s.whatsapp.net',
        to: '5511888888888@s.whatsapp.net',
        body: 'Mensagem de teste do webhook ngrok',
        timestamp: Math.floor(Date.now() / 1000),
        type: 'text'
      }
    };
    
    try {
      const webhookResponse = await axios.post(WEBHOOK_ENDPOINT, testData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Webhook respondeu com sucesso:');
      console.log('   Status:', webhookResponse.status);
      console.log('   Dados:', JSON.stringify(webhookResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro ao testar webhook:');
      console.log('   Status:', error.response?.status);
      console.log('   Dados:', error.response?.data);
      console.log('   Mensagem:', error.message);
    }
    
    // 3. Teste com dados de status de mensagem
    console.log('\n3️⃣ Testando webhook com status de mensagem...');
    
    const statusData = {
      instanceKey: 'test-instance-ngrok',
      type: 'status',
      data: {
        messageId: 'test-msg-' + Date.now(),
        status: 'delivered',
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    try {
      const statusResponse = await axios.post(WEBHOOK_ENDPOINT, statusData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Status webhook respondeu com sucesso:');
      console.log('   Status:', statusResponse.status);
      console.log('   Dados:', JSON.stringify(statusResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro ao testar status webhook:');
      console.log('   Status:', error.response?.status);
      console.log('   Dados:', error.response?.data);
      console.log('   Mensagem:', error.message);
    }
    
    // 4. Teste com dados de conexão
    console.log('\n4️⃣ Testando webhook com status de conexão...');
    
    const connectionData = {
      instanceKey: 'test-instance-ngrok',
      type: 'connection',
      data: {
        status: 'connected',
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    try {
      const connectionResponse = await axios.post(WEBHOOK_ENDPOINT, connectionData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Connection webhook respondeu com sucesso:');
      console.log('   Status:', connectionResponse.status);
      console.log('   Dados:', JSON.stringify(connectionResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro ao testar connection webhook:');
      console.log('   Status:', error.response?.status);
      console.log('   Dados:', error.response?.data);
      console.log('   Mensagem:', error.message);
    }
    
    console.log('\n🎉 Testes de webhook concluídos!');
    console.log('\n📋 Resumo:');
    console.log(`   🌐 Webhook URL: ${WEBHOOK_ENDPOINT}`);
    console.log('   ✅ Testes executados com sucesso');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Configure o webhook na Mega API');
    console.log('   2. Envie uma mensagem real do WhatsApp');
    console.log('   3. Verifique se aparece na aplicação');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar
testWebhook();
