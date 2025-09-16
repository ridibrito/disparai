// Script para testar e debugar o problema de salvamento do perfil
// Execute: node examples/test-profile-save-debug.js

const axios = require('axios');

const NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';

async function testProfileSaveDebug() {
  try {
    console.log('🔍 Testando e debugando o problema de salvamento do perfil...\n');
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
      return;
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
    
    console.log('\n🎉 Teste de debug concluído!');
    console.log('\n📋 Logs adicionados para debug:');
    console.log('   ✅ Log antes de atualizar usuário');
    console.log('   ✅ Log antes de atualizar organização');
    console.log('   ✅ Log de sucesso do salvamento');
    console.log('   ✅ Log de recarregamento da página');
    console.log('   ✅ Log de finalização do processo');
    console.log('   ✅ Log de reset dos estados de loading');
    
    console.log('\n💡 Próximos passos para debug:');
    console.log('   1. Acesse a aplicação no navegador');
    console.log('   2. Vá para Configurações > Perfil');
    console.log('   3. Abra o console do navegador (F12)');
    console.log('   4. Tente editar e salvar informações');
    console.log('   5. Observe os logs no console');
    console.log('   6. Identifique onde o processo está travando');
    
    console.log('\n🔍 Logs esperados no console:');
    console.log('   📝 Atualizando dados do usuário...');
    console.log('   ✅ Dados do usuário atualizados com sucesso');
    console.log('   🏢 Atualizando dados da empresa...');
    console.log('   ✅ Dados da empresa atualizados com sucesso');
    console.log('   🎉 Salvamento concluído com sucesso!');
    console.log('   🔄 Recarregando página...');
    console.log('   🏁 Finalizando processo de salvamento...');
    console.log('   ✅ Estados de loading resetados');
    
    console.log('\n⚠️ Se o processo travar:');
    console.log('   - Verifique se algum log não aparece');
    console.log('   - Verifique se há erros no console');
    console.log('   - Verifique se há problemas de rede');
    console.log('   - Verifique se há problemas de permissão RLS');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testProfileSaveDebug();
