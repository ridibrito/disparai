// Teste específico para a instância coruss-whatsapp-01
// Execute: node examples/test-coruss-instance.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testCorussInstance() {
  try {
    console.log('🧪 Testando instância coruss-whatsapp-01...\n');
    
    const instanceKey = 'coruss-whatsapp-01';

    // 1. Testar status da instância
    console.log('1️⃣ Verificando status da instância...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/rest/instance/${instanceKey}`, { headers });
      console.log('✅ Status da instância:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao verificar status:', error.response?.data || error.message);
    }

    // 2. Verificar se está conectada
    console.log('\n2️⃣ Verificando conexão...');
    try {
      const connectionResponse = await axios.get(`${API_BASE}/rest/instance/connection/${instanceKey}`, { headers });
      console.log('✅ Status da conexão:', JSON.stringify(connectionResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao verificar conexão:', error.response?.data || error.message);
    }

    // 3. Verificar webhook configurado
    console.log('\n3️⃣ Verificando webhook...');
    try {
      const webhookResponse = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('✅ Webhook configurado:', JSON.stringify(webhookResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao verificar webhook:', error.response?.data || error.message);
    }

    // 4. Listar todas as instâncias para comparação
    console.log('\n4️⃣ Listando todas as instâncias...');
    try {
      const instancesResponse = await axios.get(`${API_BASE}/rest/instances`, { headers });
      console.log('✅ Instâncias disponíveis:', JSON.stringify(instancesResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Erro ao listar instâncias:', error.response?.data || error.message);
    }

    console.log('\n🎉 Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.response?.data || error.message);
  }
}

// Executar teste
testCorussInstance();
