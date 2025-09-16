// Script para testar o novo URL ngrok
// Execute: node examples/test-new-ngrok.js

const axios = require('axios');

const NEW_NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';
const WEBHOOK_ENDPOINT = `${NEW_NGROK_URL}/api/mega/webhook`;
const INSTANCE_KEY = 'coruss-whatsapp-01';

async function testNewNgrok() {
  try {
    console.log('🧪 Testando novo URL ngrok...\n');
    console.log('🌐 Novo URL ngrok:', NEW_NGROK_URL);
    console.log('🔗 Webhook endpoint:', WEBHOOK_ENDPOINT);
    
    // 1. Teste básico de conectividade
    console.log('\n1️⃣ Testando conectividade básica...');
    try {
      const healthResponse = await axios.get(`${NEW_NGROK_URL}`, {
        timeout: 5000,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('✅ Aplicação está respondendo:', healthResponse.status);
      console.log('   Título da página:', healthResponse.data.includes('disparai') ? 'Disparai encontrado' : 'Página carregada');
    } catch (error) {
      console.log('⚠️ Aplicação pode não estar respondendo:', error.message);
    }
    
    // 2. Teste do webhook com dados simulados
    console.log('\n2️⃣ Testando webhook com dados simulados...');
    
    const testData = {
      instanceKey: INSTANCE_KEY,
      type: 'message',
      data: {
        messageId: 'test-msg-' + Date.now(),
        from: '5511999999999@s.whatsapp.net',
        to: '5511888888888@s.whatsapp.net',
        body: 'Mensagem de teste do novo ngrok',
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
      instanceKey: INSTANCE_KEY,
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
      instanceKey: INSTANCE_KEY,
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
    
    console.log('\n🎉 Testes do novo ngrok concluídos!');
    console.log('\n📋 Resumo:');
    console.log(`   🌐 Novo URL ngrok: ${NEW_NGROK_URL}`);
    console.log(`   🔗 Webhook endpoint: ${WEBHOOK_ENDPOINT}`);
    console.log('   ✅ Testes executados');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Certifique-se de que a aplicação está rodando (npm run dev)');
    console.log('   2. Envie uma mensagem real do WhatsApp');
    console.log('   3. Verifique se aparece na aplicação');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar
testNewNgrok();
