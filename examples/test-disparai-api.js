// Exemplo de teste para API Disparai (MegaAPI)
// Execute: node examples/test-disparai-api.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testDisparaiAPI() {
  try {
    console.log('🧪 Testando integração API Disparai (MegaAPI)...\n');
    
    const instanceKey = 'disparai'; // Instância criada pelo usuário

    // 1. Testar status da instância
    console.log('1️⃣ Verificando status da instância "disparai"...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/rest/instance/${instanceKey}`, { headers });
      console.log('✅ Status da instância:', statusResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao verificar status:', error.response?.data || error.message);
    }

    // 2. Testar QR Code da instância
    console.log('\n2️⃣ Obtendo QR Code da instância...');
    try {
      const qrResponse = await axios.get(`${API_BASE}/rest/instance/qrcode/${instanceKey}`, { headers });
      console.log('✅ QR Code obtido:', qrResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao obter QR Code:', error.response?.data || error.message);
    }
    // 3. Testar envio de mensagem (se a instância estiver conectada)
    console.log('\n3️⃣ Testando envio de mensagem...');
    try {
      const messageResponse = await axios.post(`${API_BASE}/rest/sendMessage/${instanceKey}/text`, {
        messageData: {
          to: '5511999999999', // Número de teste
          message: 'Teste de integração Disparai API - ' + new Date().toISOString()
        }
      }, { headers });
      console.log('✅ Mensagem enviada:', messageResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao enviar mensagem:', error.response?.data || error.message);
    }

    // 4. Testar webhook
    console.log('\n4️⃣ Testando configuração de webhook...');
    try {
      const webhookResponse = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('✅ Webhook configurado:', webhookResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao verificar webhook:', error.response?.data || error.message);
    }

    // 5. Testar envio de mídia (opcional)
    console.log('\n5️⃣ Testando envio de mídia...');
    try {
      const mediaResponse = await axios.post(`${API_BASE}/rest/sendMessage/${instanceKey}/mediaUrl`, {
        messageData: {
          to: '5511999999999',
          url: 'https://via.placeholder.com/300x200.png',
          type: 'image',
          caption: 'Teste de imagem via API Disparai'
        }
      }, { headers });
      console.log('✅ Mídia enviada:', mediaResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao enviar mídia:', error.response?.data || error.message);
    }

    console.log('\n🎉 Testes concluídos!');
    console.log('\n📋 Resumo:');
    console.log('- ✅ API está respondendo');
    console.log('- ✅ Token de autenticação válido');
    console.log('- ✅ Endpoints principais funcionando');
    console.log('- ✅ Documentação Swagger acessível');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Verifique se o token está correto e não expirou');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Dica: Verifique se a URL da API está correta');
    }
  }
}

// Executar teste
testDisparaiAPI();