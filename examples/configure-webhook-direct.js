// Script direto para configurar webhook na Mega API
// Execute: node examples/configure-webhook-direct.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
const NGROK_URL = 'https://b41819143523.ngrok-free.app';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function configureWebhookDirect() {
  try {
    console.log('🔧 Configurando webhook diretamente na Mega API...\n');
    console.log('🌐 URL ngrok:', NGROK_URL);
    
    // Lista de instâncias conhecidas (você pode adicionar mais)
    const knownInstances = [
      'coruss-whatsapp-01',
      'test-instance',
      'disparai-instance'
    ];
    
    // 1. Tentar listar instâncias
    console.log('1️⃣ Tentando listar instâncias...');
    try {
      const instancesResponse = await axios.get(`${API_BASE}/rest/instance/fetchInstances`, { headers });
      console.log('✅ Instâncias encontradas:', instancesResponse.data);
      
      if (instancesResponse.data && instancesResponse.data.length > 0) {
        // Usar instâncias da API
        for (const instance of instancesResponse.data) {
          const instanceKey = instance.instanceName || instance.instance_key || instance.key;
          if (instanceKey) {
            await configureInstanceWebhook(instanceKey);
          }
        }
      } else {
        console.log('⚠️ Nenhuma instância encontrada na API, tentando instâncias conhecidas...');
        // Usar instâncias conhecidas
        for (const instanceKey of knownInstances) {
          await configureInstanceWebhook(instanceKey);
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao listar instâncias, tentando instâncias conhecidas...');
      console.log('   Erro:', error.response?.data || error.message);
      
      // Usar instâncias conhecidas como fallback
      for (const instanceKey of knownInstances) {
        await configureInstanceWebhook(instanceKey);
      }
    }
    
    console.log('\n🎉 Configuração de webhook concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function configureInstanceWebhook(instanceKey) {
  try {
    console.log(`\n🔧 Configurando webhook para: ${instanceKey}`);
    
    const webhookUrl = `${NGROK_URL}/api/mega/webhook`;
    
    // 1. Verificar webhook atual
    console.log('   📋 Verificando webhook atual...');
    try {
      const currentWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('   ✅ Webhook atual:', JSON.stringify(currentWebhook.data, null, 2));
    } catch (error) {
      console.log('   ⚠️ Erro ao verificar webhook atual:', error.response?.data || error.message);
    }
    
    // 2. Configurar webhook
    console.log('   🔄 Configurando webhook...');
    try {
      const updateResponse = await axios.post(`${API_BASE}/rest/webhook/${instanceKey}`, {
        webhookUrl: webhookUrl,
        webhookEnabled: true
      }, { headers });
      console.log('   ✅ Webhook configurado:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Erro ao configurar webhook:', error.response?.data || error.message);
    }
    
    // 3. Verificar webhook após configuração
    console.log('   🔍 Verificando webhook após configuração...');
    try {
      const updatedWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
      console.log('   ✅ Webhook após configuração:', JSON.stringify(updatedWebhook.data, null, 2));
    } catch (error) {
      console.log('   ⚠️ Erro ao verificar webhook configurado:', error.response?.data || error.message);
    }
    
    // 4. Testar webhook
    console.log('   🧪 Testando webhook...');
    try {
      const testResponse = await axios.post(webhookUrl, {
        instanceKey: instanceKey,
        type: 'test',
        data: {
          message: 'Teste de webhook configurado',
          timestamp: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log('   ✅ Teste do webhook bem-sucedido:', testResponse.data);
    } catch (error) {
      console.log('   ⚠️ Erro ao testar webhook:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao configurar ${instanceKey}:`, error.message);
  }
}

// Executar
configureWebhookDirect();
