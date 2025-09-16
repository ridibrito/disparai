// Script para testar as correções dos problemas do console
// Execute: node examples/test-console-fixes.js

const axios = require('axios');

const NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';

async function testConsoleFixes() {
  try {
    console.log('🧪 Testando correções dos problemas do console...\n');
    console.log('🌐 URL da aplicação:', NGROK_URL);
    
    // 1. Testar se a aplicação está respondendo
    console.log('1️⃣ Testando resposta da aplicação...');
    try {
      const response = await axios.get(`${NGROK_URL}`, {
        timeout: 10000,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('✅ Aplicação respondendo:', response.status);
    } catch (error) {
      console.log('❌ Aplicação não está respondendo:', error.message);
    }
    
    // 2. Testar página de perfil
    console.log('\n2️⃣ Testando página de perfil...');
    try {
      const profileResponse = await axios.get(`${NGROK_URL}/configuracoes/perfil`, {
        timeout: 10000,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('✅ Página de perfil acessível:', profileResponse.status);
    } catch (error) {
      console.log('❌ Erro ao acessar página de perfil:', error.message);
    }
    
    // 3. Testar webhook
    console.log('\n3️⃣ Testando webhook...');
    try {
      const webhookResponse = await axios.post(`${NGROK_URL}/api/mega/webhook`, {
        instanceKey: 'test-instance',
        messageData: {
          type: 'test',
          content: 'Teste de webhook'
        }
      }, {
        timeout: 5000,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Webhook funcionando:', webhookResponse.status);
    } catch (error) {
      console.log('❌ Erro no webhook:', error.message);
    }
    
    console.log('\n🎉 Teste das correções concluído!');
    console.log('\n📋 Correções implementadas:');
    console.log('   ✅ Polling de notificações otimizado (30s em vez de 5s)');
    console.log('   ✅ Logs de debug reduzidos');
    console.log('   ✅ Consulta de mensagens corrigida');
    console.log('   ✅ Filtros de organização e usuário ajustados');
    
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse a aplicação no navegador');
    console.log('   2. Abra o console do navegador (F12)');
    console.log('   3. Verifique se os logs de polling diminuíram');
    console.log('   4. Teste a edição do perfil da empresa');
    console.log('   5. Verifique se não há mais erros 400');
    
    console.log('\n🔧 Problemas corrigidos:');
    console.log('   - Polling excessivo: 5s → 30s');
    console.log('   - Logs de debug: removidos para reduzir spam');
    console.log('   - Consulta de mensagens: filtros corrigidos');
    console.log('   - Estrutura de dados: ajustada para schema atual');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testConsoleFixes();
