// Script para listar todas as instâncias da conta Disparai
// Execute: node examples/list-instances.js

const axios = require('axios');

const API_BASE = 'https://teste8.megaapi.com.br';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function listAllInstances() {
  try {
    console.log('🔍 Listando todas as instâncias da conta...\n');

    // Tentar diferentes endpoints para listar instâncias
    const endpoints = [
      '/rest/instance',
      '/rest/instances',
      '/rest/instance/list',
      '/rest/instance/all'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Tentando endpoint: ${endpoint}`);
        const response = await axios.get(`${API_BASE}${endpoint}`, { headers });
        
        if (response.data) {
          console.log(`✅ Sucesso no endpoint: ${endpoint}`);
          console.log('📊 Dados retornados:', JSON.stringify(response.data, null, 2));
          
          // Se retornou um array de instâncias
          if (Array.isArray(response.data)) {
            console.log(`\n📋 Encontradas ${response.data.length} instâncias:`);
            response.data.forEach((instance, index) => {
              console.log(`${index + 1}. Nome: ${instance.name || instance.key || 'N/A'}`);
              console.log(`   Status: ${instance.status || 'N/A'}`);
              console.log(`   Key: ${instance.key || 'N/A'}`);
              console.log(`   Criada em: ${instance.created_at || 'N/A'}`);
              console.log('   ---');
            });
          }
          // Se retornou um objeto com instâncias
          else if (response.data.instances && Array.isArray(response.data.instances)) {
            console.log(`\n📋 Encontradas ${response.data.instances.length} instâncias:`);
            response.data.instances.forEach((instance, index) => {
              console.log(`${index + 1}. Nome: ${instance.name || instance.key || 'N/A'}`);
              console.log(`   Status: ${instance.status || 'N/A'}`);
              console.log(`   Key: ${instance.key || 'N/A'}`);
              console.log(`   Criada em: ${instance.created_at || 'N/A'}`);
              console.log('   ---');
            });
          }
          // Se retornou dados de uma única instância
          else if (response.data.instance) {
            console.log(`\n📋 Instância única encontrada:`);
            const instance = response.data.instance;
            console.log(`1. Nome: ${instance.name || instance.key || 'N/A'}`);
            console.log(`   Status: ${instance.status || 'N/A'}`);
            console.log(`   Key: ${instance.key || 'N/A'}`);
            console.log(`   Criada em: ${instance.created_at || 'N/A'}`);
          }
          
          return; // Se encontrou dados, para de tentar outros endpoints
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} falhou:`, error.response?.status || error.message);
      }
    }

    // Se nenhum endpoint funcionou, tentar criar uma nova instância para ver a resposta
    console.log('\n🔄 Nenhum endpoint de listagem funcionou. Tentando criar uma instância de teste...');
    
    try {
      const createResponse = await axios.post(`${API_BASE}/rest/instance/create`, {
        instanceName: `teste-${Date.now()}`,
        qr: true
      }, { headers });
      
      console.log('✅ Resposta da criação:', JSON.stringify(createResponse.data, null, 2));
      
      // Se criou com sucesso, deletar a instância de teste
      if (createResponse.data && createResponse.data.instance && createResponse.data.instance.key) {
        const instanceKey = createResponse.data.instance.key;
        console.log(`\n🗑️ Deletando instância de teste: ${instanceKey}`);
        
        try {
          await axios.delete(`${API_BASE}/rest/instance/${instanceKey}`, { headers });
          console.log('✅ Instância de teste deletada com sucesso');
        } catch (deleteError) {
          console.log('⚠️ Não foi possível deletar a instância de teste:', deleteError.response?.data || deleteError.message);
        }
      }
    } catch (createError) {
      console.log('❌ Erro ao criar instância de teste:', createError.response?.data || createError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
listAllInstances();
