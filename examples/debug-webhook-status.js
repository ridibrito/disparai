// Script para debugar o status da instância na Mega API
// Execute: node examples/debug-webhook-status.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function debugWebhookStatus() {
  try {
    console.log('🔍 Debugando status da instância...\n');
    
    const instanceKey = 'coruss-whatsapp-01';
    
    // 1. Verificar status da instância
    console.log('1️⃣ Verificando status da instância...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/rest/instance/${instanceKey}`, { headers });
      console.log('✅ Status da instância:', JSON.stringify(statusResponse.data, null, 2));
      
      // Verificar se tem user ou connected
      const statusData = statusResponse.data;
      const hasUser = !!statusData?.instance?.user;
      const isConnected = statusData?.instance?.status === 'connected';
      
      console.log('\n📊 Análise do status:');
      console.log('- Tem user:', hasUser);
      console.log('- Status é connected:', isConnected);
      console.log('- User data:', statusData?.instance?.user);
      
      // Simular a lógica do webhook
      const connected = !!(statusData?.instance?.user || statusData?.instance?.connected === true);
      console.log('- Resultado da lógica do webhook:', connected);
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar status:', error.response?.data || error.message);
    }
    
    // 2. Simular webhook com dados reais
    console.log('\n2️⃣ Simulando webhook...');
    try {
      const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
      const webhookPayload = {
        instanceKey: instanceKey,
        type: 'status',
        data: {
          status: 'connected',
          user: {
            id: '556181601063@s.whatsapp.net',
            name: 'Coruss'
          }
        }
      };
      
      console.log('📤 Enviando payload:', JSON.stringify(webhookPayload, null, 2));
      
      const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Resposta do webhook:', webhookResponse.data);
      
    } catch (error) {
      console.log('⚠️ Erro ao simular webhook:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar
debugWebhookStatus();
