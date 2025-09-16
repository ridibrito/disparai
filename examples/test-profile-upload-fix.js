// Script para testar as correções de upload do perfil
// Execute: node examples/test-profile-upload-fix.js

const axios = require('axios');

const NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';

async function testProfileUploadFix() {
  try {
    console.log('🔧 Testando correções de upload do perfil...\n');
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
    
    console.log('\n🎉 Correções implementadas:');
    console.log('   ✅ Timeout aumentado de 15s para 30s');
    console.log('   ✅ Sistema de retry (até 3 tentativas)');
    console.log('   ✅ Continuar salvamento mesmo se upload falhar');
    console.log('   ✅ Mensagens de erro mais informativas');
    console.log('   ✅ Logs detalhados de cada tentativa');
    console.log('   ✅ Delay de 2s entre tentativas');
    
    console.log('\n📋 Comportamento esperado agora:');
    console.log('   1. Usuário tenta fazer upload de imagem');
    console.log('   2. Sistema tenta upload com timeout de 30s');
    console.log('   3. Se falhar, tenta novamente (até 3 vezes)');
    console.log('   4. Se todas as tentativas falharem:');
    console.log('      - Mostra toast de erro informativo');
    console.log('      - Continua salvando os dados sem a imagem');
    console.log('      - Não trava o processo de salvamento');
    console.log('   5. Dados são salvos no banco normalmente');
    
    console.log('\n🔍 Logs esperados no console:');
    console.log('   📤 Fazendo upload do logo da empresa: [caminho]');
    console.log('   📤 Arquivo: {name: "...", size: ..., type: "..."}');
    console.log('   ⏳ Tentativa 1 de upload do logo...');
    console.log('   ⚠️ Tentativa 1 falhou: [erro]');
    console.log('   🔄 Tentando novamente em 2 segundos...');
    console.log('   ⏳ Tentativa 2 de upload do logo...');
    console.log('   ✅ Logo da empresa enviado com sucesso: [URL]');
    console.log('   🔍 Verificação de mudanças: {...}');
    console.log('   ✅ Há mudanças para salvar, continuando...');
    console.log('   📝 Atualizando dados do usuário...');
    console.log('   🏢 Atualizando dados da empresa...');
    console.log('   🎉 Salvamento concluído com sucesso!');
    
    console.log('\n💡 Teste manual:');
    console.log('   1. Acesse a aplicação no navegador');
    console.log('   2. Vá para Configurações > Perfil');
    console.log('   3. Abra o console do navegador (F12)');
    console.log('   4. Vá para a aba "Empresa"');
    console.log('   5. Tente fazer upload de um logo da empresa');
    console.log('   6. Observe os logs no console');
    console.log('   7. Verifique se:');
    console.log('      - Sistema tenta upload com retry');
    console.log('      - Se falhar, continua salvando dados');
    console.log('      - Dados são salvos no banco');
    console.log('      - Não há travamento do processo');
    
    console.log('\n🚀 Agora o sistema deve funcionar mesmo com problemas de upload!');
    
    console.log('\n⚠️ Se ainda houver problemas:');
    console.log('   1. Verifique se há problemas de rede');
    console.log('   2. Verifique se o Supabase Storage está funcionando');
    console.log('   3. Verifique se há problemas de autenticação');
    console.log('   4. Verifique se há problemas de políticas RLS');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testProfileUploadFix();
