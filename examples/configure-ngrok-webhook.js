// Script para configurar webhook com novo link ngrok
// Execute: node examples/configure-ngrok-webhook.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
const NEW_NGROK_URL = 'https://b41819143523.ngrok-free.app';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function configureNgrokWebhook() {
  try {
    console.log('🔧 Configurando webhook com novo link ngrok...\n');
    console.log('🌐 Novo URL ngrok:', NEW_NGROK_URL);
    
    // 1. Listar todas as instâncias
    console.log('1️⃣ Listando instâncias disponíveis...');
    try {
      const instancesResponse = await axios.get(`${API_BASE}/rest/instance/fetchInstances`, { headers });
      console.log('✅ Instâncias encontradas:', instancesResponse.data);
      
      const instances = instancesResponse.data;
      if (!instances || instances.length === 0) {
        console.log('⚠️ Nenhuma instância encontrada');
        return;
      }
      
      // 2. Configurar webhook para cada instância
      for (const instance of instances) {
        const instanceKey = instance.instanceName || instance.instance_key || instance.key;
        if (!instanceKey) {
          console.log('⚠️ Instância sem chave válida:', instance);
          continue;
        }
        
        console.log(`\n2️⃣ Configurando webhook para instância: ${instanceKey}`);
        
        const webhookUrl = `${NEW_NGROK_URL}/api/mega/webhook`;
        
        // Verificar webhook atual
        console.log('   📋 Verificando webhook atual...');
        try {
          const currentWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
          console.log('   ✅ Webhook atual:', JSON.stringify(currentWebhook.data, null, 2));
        } catch (error) {
          console.log('   ⚠️ Erro ao verificar webhook atual:', error.response?.data || error.message);
        }
        
        // Atualizar webhook
        console.log('   🔄 Atualizando webhook...');
        try {
          const updateResponse = await axios.post(`${API_BASE}/rest/webhook/${instanceKey}`, {
            webhookUrl: webhookUrl,
            webhookEnabled: true
          }, { headers });
          console.log('   ✅ Webhook atualizado:', JSON.stringify(updateResponse.data, null, 2));
        } catch (error) {
          console.log('   ❌ Erro ao atualizar webhook:', error.response?.data || error.message);
        }
        
        // Verificar webhook após atualização
        console.log('   🔍 Verificando webhook após atualização...');
        try {
          const updatedWebhook = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
          console.log('   ✅ Webhook após atualização:', JSON.stringify(updatedWebhook.data, null, 2));
        } catch (error) {
          console.log('   ⚠️ Erro ao verificar webhook atualizado:', error.response?.data || error.message);
        }
        
        // Testar webhook
        console.log('   🧪 Testando webhook...');
        try {
          const testResponse = await axios.post(webhookUrl, {
            instanceKey: instanceKey,
            type: 'test',
            data: {
              message: 'Teste de webhook com novo ngrok',
              timestamp: new Date().toISOString(),
              instance: instanceKey
            }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('   ✅ Teste do webhook bem-sucedido:', testResponse.data);
        } catch (error) {
          console.log('   ⚠️ Erro ao testar webhook:', error.response?.data || error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao listar instâncias:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Processo de configuração concluído!');
    console.log('\n📋 Resumo:');
    console.log(`   🌐 Novo URL ngrok: ${NEW_NGROK_URL}`);
    console.log(`   🔗 Webhook endpoint: ${NEW_NGROK_URL}/api/mega/webhook`);
    console.log('   ✅ Todas as instâncias foram atualizadas');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique se o ngrok está rodando');
    console.log('   2. Teste enviando uma mensagem do WhatsApp');
    console.log('   3. Verifique se as mensagens aparecem na aplicação');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar
configureNgrokWebhook();
