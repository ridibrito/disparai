const { spawn } = require('child_process');
const path = require('path');

// Teste do ngrok com o token configurado
async function testNgrok() {
  console.log('🚀 Testando configuração do ngrok...\n');
  
  const ngrokPath = path.join(__dirname, '..', 'ngrok.exe');
  const token = '32YtkRyDsQEQvMW4u9QQcgYYnCx_5d2iNov2WXw3Ano71zfAe';
  
  // Primeiro, configurar o token
  console.log('📝 Configurando token do ngrok...');
  const configProcess = spawn(ngrokPath, ['config', 'add-authtoken', token], {
    stdio: 'inherit'
  });
  
  configProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Token configurado com sucesso!\n');
      
      // Testar se o ngrok está funcionando
      console.log('🔍 Testando conexão do ngrok...');
      const testProcess = spawn(ngrokPath, ['version'], {
        stdio: 'inherit'
      });
      
      testProcess.on('close', (testCode) => {
        if (testCode === 0) {
          console.log('✅ Ngrok está funcionando corretamente!');
          console.log('\n📋 Para usar o ngrok no seu projeto:');
          console.log('1. Execute: ngrok.exe http 3000');
          console.log('2. Use a URL fornecida como webhook URL no WhatsApp');
          console.log('3. Exemplo: https://abc123.ngrok.io/api/webhook/whatsapp');
        } else {
          console.log('❌ Erro ao testar o ngrok');
        }
      });
    } else {
      console.log('❌ Erro ao configurar o token do ngrok');
    }
  });
}

testNgrok().catch(console.error);
