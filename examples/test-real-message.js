// Teste com payload real de mensagem
// Execute: node examples/test-real-message.js

const axios = require('axios');

async function testRealMessage() {
  try {
    console.log('🧪 Testando com payload real de mensagem...\n');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    
    // Payload baseado no que você recebeu
    const realPayload = {
      instance_key: 'coruss-whatsapp-01',
      jid: '556181601063@s.whatsapp.net',
      messageType: 'extendedTextMessage',
      key: {
        remoteJid: '556183555195@s.whatsapp.net',
        fromMe: false,
        id: '3F37652746FC4E7DB66E'
      },
      messageTimestamp: 1757692869,
      pushName: 'Ricardo Albuquerque',
      broadcast: false,
      message: {
        extendedTextMessage: {
          text: 'Olá! Esta é uma mensagem de teste do Ricardo.'
        }
      },
      isGroup: false
    };
    
    console.log('📤 Enviando payload real:', JSON.stringify(realPayload, null, 2));
    
    const response = await axios.post(webhookUrl, realPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta do webhook:', response.data);
    
    console.log('\n🎉 Teste concluído!');
    console.log('📋 Agora verifique:');
    console.log('1. Se a mensagem apareceu no dashboard');
    console.log('2. Se não há mais erros no terminal');
    console.log('3. Se a instância está marcada como ativa');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar
testRealMessage();
