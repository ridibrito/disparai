const fetch = require('node-fetch');

async function testNotifications() {
  console.log('🧪 Testando sistema de notificações...\n');

  try {
    // Testar se o servidor está rodando
    console.log('1️⃣ Verificando se o servidor está rodando...');
    const healthResponse = await fetch('http://localhost:3000/');
    if (healthResponse.ok) {
      console.log('✅ Servidor está rodando');
    } else {
      console.log('❌ Servidor não está respondendo');
      return;
    }

    // Enviar mensagem de teste
    console.log('\n2️⃣ Enviando mensagem de teste...');
    const testMessage = {
      instance_key: "coruss-whatsapp-01",
      jid: "556181601063@s.whatsapp.net",
      messageType: "conversation",
      key: {
        remoteJid: "556183555195@s.whatsapp.net",
        fromMe: false,
        id: `NOTIFICATION_TEST_${Date.now()}`
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: "Teste Notificações",
      broadcast: false,
      message: {
        conversation: "Teste de notificação - esta mensagem deve gerar uma notificação nativa!"
      }
    };

    console.log('📤 Enviando:', JSON.stringify(testMessage, null, 2));

    const response = await fetch('http://localhost:3000/api/mega/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();
    console.log('📥 Resposta:', result);

    if (response.ok) {
      console.log('\n✅ Mensagem enviada com sucesso!');
      console.log('\n📋 Verifique:');
      console.log('1. Se apareceu uma notificação nativa do navegador');
      console.log('2. Se o título da aba mudou para "(1) Disparai"');
      console.log('3. Se apareceu um contador verde no header "Conversas"');
      console.log('4. Se a conversa apareceu na lista de conversas');
      console.log('\n🔍 Se não apareceu notificação:');
      console.log('- Verifique se aceitou as permissões de notificação');
      console.log('- Verifique o console do navegador (F12)');
      console.log('- Verifique se o banner de permissão apareceu');
    } else {
      console.log('❌ Erro ao enviar mensagem:', result);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testNotifications();
