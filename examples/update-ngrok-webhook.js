// Script para atualizar webhook com novo URL ngrok
// Execute: node examples/update-ngrok-webhook.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
const NEW_NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';
const INSTANCE_KEY = 'coruss-whatsapp-01';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function updateNgrokWebhook() {
  try {
    console.log('🔄 Atualizando webhook com novo URL ngrok...\n');
    console.log('🌐 Novo URL ngrok:', NEW_NGROK_URL);
    console.log('📱 Instância:', INSTANCE_KEY);
    
    const webhookUrl = `${NEW_NGROK_URL}/api/mega/webhook`;
    
    // 1. Verificar webhook atual
    console.log('\n1️⃣ Verificando webhook atual...');
    try {
      const currentWebhook = await axios.get(`${API_BASE}/rest/webhook/${INSTANCE_KEY}`, { headers });
      console.log('   📋 Webhook atual:');
      console.log(`      URL: ${currentWebhook.data.webhookData.webhookUrl}`);
      console.log(`      Habilitado: ${currentWebhook.data.webhookData.webhookEnabled}`);
    } catch (error) {
      console.log('   ❌ Erro ao verificar webhook atual:', error.response?.data || error.message);
    }
    
    // 2. Atualizar webhook
    console.log('\n2️⃣ Atualizando webhook...');
    try {
      const updateResponse = await axios.post(`${API_BASE}/rest/webhook/${INSTANCE_KEY}`, {
        webhookUrl: webhookUrl,
        webhookEnabled: true
      }, { headers });
      
      console.log('   ✅ Webhook atualizado com sucesso!');
      console.log(`      Nova URL: ${webhookUrl}`);
      console.log('      Resposta:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Erro ao atualizar webhook:', error.response?.data || error.message);
    }
    
    // 3. Verificar webhook após atualização
    console.log('\n3️⃣ Verificando webhook após atualização...');
    try {
      const updatedWebhook = await axios.get(`${API_BASE}/rest/webhook/${INSTANCE_KEY}`, { headers });
      console.log('   ✅ Webhook após atualização:');
      console.log(`      URL: ${updatedWebhook.data.webhookData.webhookUrl}`);
      console.log(`      Habilitado: ${updatedWebhook.data.webhookData.webhookEnabled}`);
      
      if (updatedWebhook.data.webhookData.webhookUrl === webhookUrl) {
        console.log('   ✅ URL do webhook atualizada corretamente!');
      } else {
        console.log('   ⚠️ URL do webhook não foi atualizada corretamente');
      }
    } catch (error) {
      console.log('   ❌ Erro ao verificar webhook atualizado:', error.response?.data || error.message);
    }
    
    // 4. Testar webhook
    console.log('\n4️⃣ Testando webhook...');
    try {
      const testResponse = await axios.post(webhookUrl, {
        instanceKey: INSTANCE_KEY,
        type: 'test',
        data: {
          message: 'Teste de webhook com novo ngrok',
          timestamp: new Date().toISOString(),
          from: 'test@s.whatsapp.net',
          to: 'test@s.whatsapp.net'
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('   ✅ Teste do webhook bem-sucedido!');
      console.log(`      Status: ${testResponse.status}`);
      console.log('      Resposta:', JSON.stringify(testResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Erro ao testar webhook:');
      console.log(`      Status: ${error.response?.status}`);
      console.log(`      Dados: ${JSON.stringify(error.response?.data, null, 2)}`);
      console.log(`      Mensagem: ${error.message}`);
    }
    
    // 5. Resumo final
    console.log('\n📋 Resumo da atualização:');
    console.log('   🌐 Novo URL ngrok:', NEW_NGROK_URL);
    console.log('   🔗 Webhook endpoint:', webhookUrl);
    console.log('   📱 Instância:', INSTANCE_KEY);
    console.log('   ✅ Webhook atualizado e testado');
    
    console.log('\n💡 Próximos passos:');
    console.log('   1. Certifique-se de que o novo ngrok está rodando');
    console.log('   2. Certifique-se de que a aplicação está rodando (npm run dev)');
    console.log('   3. Envie uma mensagem do WhatsApp para testar');
    console.log('   4. Verifique se a mensagem aparece na aplicação');
    
    console.log('\n🔧 Comandos úteis:');
    console.log('   - Verificar ngrok: ngrok status');
    console.log('   - Iniciar aplicação: npm run dev');
    console.log('   - Verificar webhook: node examples/check-webhook-status.js');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
updateNgrokWebhook();
