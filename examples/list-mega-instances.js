// Script para listar todas as instâncias da Mega API
// Execute: node examples/list-mega-instances.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function listMegaInstances() {
  try {
    console.log('📋 Listando instâncias da Mega API...\n');
    
    // 1. Tentar diferentes endpoints para listar instâncias
    const endpoints = [
      '/rest/instance/fetchInstances',
      '/rest/instance/list',
      '/rest/instance/all',
      '/rest/instances',
      '/rest/instance'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Tentando endpoint: ${endpoint}`);
        const response = await axios.get(`${API_BASE}${endpoint}`, { headers });
        console.log(`✅ Sucesso em ${endpoint}:`);
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n');
      } catch (error) {
        console.log(`❌ Erro em ${endpoint}:`, error.response?.data || error.message);
      }
    }
    
    // 2. Tentar verificar instâncias específicas conhecidas
    console.log('🔍 Verificando instâncias específicas...');
    const knownInstances = [
      'coruss-whatsapp-01',
      'test-instance',
      'disparai-instance',
      'whatsapp-01',
      'instance-01'
    ];
    
    for (const instanceKey of knownInstances) {
      try {
        console.log(`\n📱 Verificando instância: ${instanceKey}`);
        
        // Verificar status da instância
        const statusResponse = await axios.get(`${API_BASE}/rest/instance/status/${instanceKey}`, { headers });
        console.log(`   ✅ Status:`, JSON.stringify(statusResponse.data, null, 2));
        
        // Verificar webhook da instância
        const webhookResponse = await axios.get(`${API_BASE}/rest/webhook/${instanceKey}`, { headers });
        console.log(`   🔗 Webhook:`, JSON.stringify(webhookResponse.data, null, 2));
        
      } catch (error) {
        console.log(`   ❌ Instância ${instanceKey} não encontrada:`, error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 Listagem de instâncias concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
listMegaInstances();
