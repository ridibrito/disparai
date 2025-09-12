// Teste com nova mensagem
// Execute: node examples/test-new-message.js

const axios = require('axios');

async function testNewMessage() {
  try {
    console.log('🧪 Testando com nova mensagem...\n');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    
    // Nova mensagem com ID diferente
    const newMessagePayload = {
      instance_key: 'coruss-whatsapp-01',
      jid: '556181601063@s.whatsapp.net',
      messageType: 'conversation',
      key: {
        remoteJid: '556183555195@s.whatsapp.net',
        fromMe: false,
        id: 'NEW_MESSAGE_' + Date.now()
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Ricardo Albuquerque',
      broadcast: false,
      message: {
        conversation: 'Esta é uma nova mensagem de teste!'
      },
      isGroup: false
    };
    
    console.log('📤 Enviando nova mensagem:', JSON.stringify(newMessagePayload, null, 2));
    
    const response = await axios.post(webhookUrl, newMessagePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta do webhook:', response.data);
    
    console.log('\n🎉 Teste concluído!');
    console.log('📋 Agora verifique no terminal do servidor:');
    console.log('1. Se foi criado um novo contato');
    console.log('2. Se foi criada uma nova conversa');
    console.log('3. Se a mensagem foi salva');
    console.log('4. Se não há erros');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar
testNewMessage();
