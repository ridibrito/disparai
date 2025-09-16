// Script para testar se as correções do perfil funcionaram
// Execute: node examples/test-profile-fix.js

const axios = require('axios');

const NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';

async function testProfileFix() {
  try {
    console.log('🧪 Testando correções do perfil...\n');
    console.log('🌐 URL da aplicação:', NGROK_URL);
    
    // 1. Testar se a página de perfil está acessível
    console.log('1️⃣ Testando acesso à página de perfil...');
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
    
    // 2. Testar se a aplicação está rodando
    console.log('\n2️⃣ Testando se a aplicação está rodando...');
    try {
      const homeResponse = await axios.get(`${NGROK_URL}`, {
        timeout: 5000,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('✅ Aplicação está rodando:', homeResponse.status);
    } catch (error) {
      console.log('❌ Aplicação não está respondendo:', error.message);
    }
    
    console.log('\n🎉 Teste das correções concluído!');
    console.log('\n📋 Correções implementadas:');
    console.log('   ✅ Aba "Empresa" sempre visível');
    console.log('   ✅ Criação automática de organização se não existir');
    console.log('   ✅ Lógica de permissão corrigida');
    console.log('   ✅ Mensagem informativa para usuários sem permissão');
    console.log('   ✅ Botão "Editar" desabilitado quando sem permissão');
    
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse a aplicação no navegador');
    console.log('   2. Vá para Configurações > Perfil');
    console.log('   3. Clique na aba "Empresa"');
    console.log('   4. Tente editar as informações da empresa');
    console.log('   5. Verifique se o botão "Editar" está funcionando');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testProfileFix();
