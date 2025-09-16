// Script para testar problemas de upload no perfil
// Execute: node examples/test-profile-upload-issue.js

const axios = require('axios');

const NGROK_URL = 'https://f80b5d48f7c3.ngrok-free.app';

async function testProfileUploadIssue() {
  try {
    console.log('🔍 Testando problemas de upload no perfil...\n');
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
    
    console.log('\n🎉 Logs adicionados para debug de upload:');
    console.log('   ✅ Logs detalhados do arquivo (nome, tamanho, tipo)');
    console.log('   ✅ Log antes de iniciar upload');
    console.log('   ✅ Log após concluir upload');
    console.log('   ✅ Timeout de 15 segundos para upload do logo');
    console.log('   ✅ Logs de verificação de mudanças');
    
    console.log('\n🔍 Logs esperados no console:');
    console.log('   📤 Fazendo upload do logo da empresa: [caminho]');
    console.log('   📤 Arquivo: {name: "...", size: ..., type: "..."}');
    console.log('   ⏳ Aguardando upload do logo...');
    console.log('   ✅ Upload do logo concluído, verificando erro...');
    console.log('   ✅ Logo da empresa enviado com sucesso: [URL]');
    console.log('   🔍 Verificação de mudanças: {...}');
    console.log('   ✅ Há mudanças para salvar, continuando...');
    console.log('   📝 Atualizando dados do usuário...');
    console.log('   🏢 Atualizando dados da empresa...');
    
    console.log('\n💡 Teste manual:');
    console.log('   1. Acesse a aplicação no navegador');
    console.log('   2. Vá para Configurações > Perfil');
    console.log('   3. Abra o console do navegador (F12)');
    console.log('   4. Vá para a aba "Empresa"');
    console.log('   5. Tente fazer upload de um logo da empresa');
    console.log('   6. Observe os logs no console');
    console.log('   7. Identifique onde o processo trava:');
    console.log('      - Se trava em "⏳ Aguardando upload do logo..."');
    console.log('        → Problema de conectividade ou timeout');
    console.log('      - Se trava em "✅ Upload do logo concluído..."');
    console.log('        → Problema na verificação de erro');
    console.log('      - Se não aparece "🔍 Verificação de mudanças"');
    console.log('        → Problema no upload em si');
    console.log('      - Se aparece "🔍 Verificação de mudanças" mas não continua');
    console.log('        → Problema na lógica de verificação');
    
    console.log('\n⚠️ Possíveis problemas:');
    console.log('   1. Arquivo muito grande (>5MB)');
    console.log('   2. Tipo de arquivo não suportado');
    console.log('   3. Problemas de conectividade com Supabase');
    console.log('   4. Timeout de rede');
    console.log('   5. Problemas de autenticação no storage');
    console.log('   6. Políticas RLS bloqueando upload');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testProfileUploadIssue();
