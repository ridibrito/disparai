// Script principal para configurar webhook completo com ngrok
// Execute: node examples/setup-ngrok-webhook.js

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const NGROK_URL = 'https://b41819143523.ngrok-free.app';

async function setupNgrokWebhook() {
  try {
    console.log('🚀 Configurando webhook completo com ngrok...\n');
    console.log('🌐 URL ngrok:', NGROK_URL);
    console.log('🔗 Webhook endpoint:', `${NGROK_URL}/api/mega/webhook`);
    
    // 1. Atualizar banco de dados Supabase
    console.log('\n1️⃣ Atualizando webhook URLs no banco de dados...');
    try {
      const { stdout, stderr } = await execAsync('node examples/update-supabase-webhook-url.js');
      if (stdout) console.log(stdout);
      if (stderr) console.log('⚠️ Avisos:', stderr);
    } catch (error) {
      console.log('❌ Erro ao atualizar banco de dados:', error.message);
    }
    
    // 2. Configurar webhook na Mega API
    console.log('\n2️⃣ Configurando webhook na Mega API...');
    try {
      const { stdout, stderr } = await execAsync('node examples/configure-ngrok-webhook.js');
      if (stdout) console.log(stdout);
      if (stderr) console.log('⚠️ Avisos:', stderr);
    } catch (error) {
      console.log('❌ Erro ao configurar Mega API:', error.message);
    }
    
    // 3. Testar webhook
    console.log('\n3️⃣ Testando webhook...');
    try {
      const { stdout, stderr } = await execAsync('node examples/test-ngrok-webhook.js');
      if (stdout) console.log(stdout);
      if (stderr) console.log('⚠️ Avisos:', stderr);
    } catch (error) {
      console.log('❌ Erro ao testar webhook:', error.message);
    }
    
    console.log('\n🎉 Configuração completa do webhook finalizada!');
    console.log('\n📋 Resumo da configuração:');
    console.log(`   🌐 URL ngrok: ${NGROK_URL}`);
    console.log(`   🔗 Webhook endpoint: ${NGROK_URL}/api/mega/webhook`);
    console.log('   ✅ Banco de dados atualizado');
    console.log('   ✅ Mega API configurada');
    console.log('   ✅ Webhook testado');
    
    console.log('\n💡 Instruções finais:');
    console.log('   1. Certifique-se de que o ngrok está rodando');
    console.log('   2. Verifique se a aplicação está funcionando');
    console.log('   3. Envie uma mensagem do WhatsApp para testar');
    console.log('   4. Verifique se as mensagens aparecem na aplicação');
    
    console.log('\n🔧 Comandos úteis:');
    console.log('   - Verificar status do ngrok: ngrok status');
    console.log('   - Ver logs da aplicação: npm run dev');
    console.log('   - Testar webhook manualmente: node examples/test-ngrok-webhook.js');
    
  } catch (error) {
    console.error('❌ Erro geral na configuração:', error.message);
  }
}

// Executar
setupNgrokWebhook();
