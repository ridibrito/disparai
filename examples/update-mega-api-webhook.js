// Script para atualizar webhook na Mega API
// Execute: node examples/update-mega-api-webhook.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function updateMegaApiWebhook() {
  try {
    console.log('🔧 Atualizando webhook na Mega API...\n');
    
    const instanceKey = 'coruss-whatsapp-01';
    const newWebhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    
    // 1. Verificar webhook atual
    console.log('1️⃣ Verificando webhook atual...');
    try {
      const currentWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('✅ Webhook atual:', JSON.stringify(currentWebhook.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao verificar webhook atual:', error.response?.data || error.message);
    }
    
    // 2. Atualizar webhook
    console.log('\n2️⃣ Atualizando webhook...');
    try {
      const updateResponse = await axios.post(`${API_BASE}/rest/webhook/${instanceKey}`, {
        webhookUrl: newWebhookUrl,
        webhookEnabled: true
      }, { headers });
      console.log('✅ Webhook atualizado:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao atualizar webhook:', error.response?.data || error.message);
    }
    
    // 3. Verificar webhook após atualização
    console.log('\n3️⃣ Verificando webhook após atualização...');
    try {
      const updatedWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('✅ Webhook após atualização:', JSON.stringify(updatedWebhook.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao verificar webhook atualizado:', error.response?.data || error.message);
    }
    
    // 4. Testar webhook
    console.log('\n4️⃣ Testando webhook...');
    try {
      const testResponse = await axios.post(newWebhookUrl, {
        instanceKey: instanceKey,
        type: 'test',
        data: {
          message: 'Teste de webhook atualizado',
          timestamp: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Teste do webhook:', testResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao testar webhook:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar
updateMegaApiWebhook();
