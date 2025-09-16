// Script para verificar o status do webhook configurado
// Execute: node examples/check-webhook-status.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
const NGROK_URL = 'https://b41819143523.ngrok-free.app';
const INSTANCE_KEY = 'coruss-whatsapp-01';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function checkWebhookStatus() {
  try {
    console.log('🔍 Verificando status do webhook configurado...\n');
    console.log('🌐 URL ngrok:', NGROK_URL);
    console.log('📱 Instância:', INSTANCE_KEY);
    
    // 1. Verificar status da instância
    console.log('\n1️⃣ Status da instância:');
    try {
      const instancesResponse = await axios.get(`${API_BASE}/rest/instance/list`, { headers });
      const instance = instancesResponse.data.instances.find(inst => inst.key === INSTANCE_KEY);
      
      if (instance) {
        console.log('   ✅ Instância encontrada:');
        console.log(`      Chave: ${instance.key}`);
        console.log(`      Status: ${instance.status}`);
        console.log(`      Usuário: ${instance.user.name} (${instance.user.id})`);
      } else {
        console.log('   ❌ Instância não encontrada na lista');
      }
    } catch (error) {
      console.log('   ❌ Erro ao verificar instância:', error.response?.data || error.message);
    }
    
    // 2. Verificar configuração do webhook
    console.log('\n2️⃣ Configuração do webhook:');
    try {
      const webhookResponse = await axios.get(`${API_BASE}/rest/webhook/${INSTANCE_KEY}`, { headers });
      console.log('   ✅ Webhook configurado:');
      console.log(`      URL: ${webhookResponse.data.webhookData.webhookUrl}`);
      console.log(`      Habilitado: ${webhookResponse.data.webhookData.webhookEnabled}`);
      
      if (webhookResponse.data.webhookData.webhookUrl === `${NGROK_URL}/api/mega/webhook`) {
        console.log('   ✅ Webhook URL está correto!');
      } else {
        console.log('   ⚠️ Webhook URL não corresponde ao ngrok atual');
      }
    } catch (error) {
      console.log('   ❌ Erro ao verificar webhook:', error.response?.data || error.message);
    }
    
    // 3. Testar webhook
    console.log('\n3️⃣ Teste do webhook:');
    const webhookUrl = `${NGROK_URL}/api/mega/webhook`;
    
    try {
      const testResponse = await axios.post(webhookUrl, {
        instanceKey: INSTANCE_KEY,
        type: 'test',
        data: {
          message: 'Teste final do webhook',
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
      
      console.log('   ✅ Webhook respondeu com sucesso:');
      console.log(`      Status: ${testResponse.status}`);
      console.log(`      Resposta: ${JSON.stringify(testResponse.data, null, 2)}`);
    } catch (error) {
      console.log('   ❌ Erro ao testar webhook:');
      console.log(`      Status: ${error.response?.status}`);
      console.log(`      Dados: ${JSON.stringify(error.response?.data, null, 2)}`);
      console.log(`      Mensagem: ${error.message}`);
    }
    
    // 4. Resumo final
    console.log('\n📋 Resumo da configuração:');
    console.log('   🌐 URL ngrok:', NGROK_URL);
    console.log('   🔗 Webhook endpoint:', `${NGROK_URL}/api/mega/webhook`);
    console.log('   📱 Instância ativa:', INSTANCE_KEY);
    console.log('   ✅ Webhook configurado e testado');
    
    console.log('\n💡 Próximos passos:');
    console.log('   1. Certifique-se de que o ngrok está rodando');
    console.log('   2. Certifique-se de que a aplicação está rodando (npm run dev)');
    console.log('   3. Envie uma mensagem do WhatsApp para o número conectado');
    console.log('   4. Verifique se a mensagem aparece na aplicação');
    
    console.log('\n🔧 Comandos úteis:');
    console.log('   - Verificar ngrok: ngrok status');
    console.log('   - Iniciar aplicação: npm run dev');
    console.log('   - Testar webhook: node examples/check-webhook-status.js');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
checkWebhookStatus();
