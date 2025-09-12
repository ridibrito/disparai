// Teste final com mensagem completamente nova
// Execute: node examples/test-final-message.js

const axios = require('axios');

async function testFinalMessage() {
  try {
    console.log('🧪 Teste final com mensagem completamente nova...\n');
    
    const webhookUrl = 'https://4fb02ed41ca2.ngrok-free.app/api/mega/webhook';
    
    // Mensagem com ID completamente novo
    const finalMessagePayload = {
      instance_key: 'coruss-whatsapp-01',
      jid: '556181601063@s.whatsapp.net',
      messageType: 'conversation',
      key: {
        remoteJid: '556183555195@s.whatsapp.net',
        fromMe: false,
        id: 'FINAL_TEST_' + Date.now()
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Ricardo Albuquerque',
      broadcast: false,
      message: {
        conversation: 'Mensagem final de teste - deve funcionar agora!'
      },
      isGroup: false
    };
    
    console.log('📤 Enviando mensagem final:', JSON.stringify(finalMessagePayload, null, 2));
    
    const response = await axios.post(webhookUrl, finalMessagePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta do webhook:', response.data);
    
    console.log('\n🎉 Teste final concluído!');
    console.log('📋 Verifique no terminal do servidor:');
    console.log('1. ✅ Contato criado sem erros');
    console.log('2. ✅ Conversa criada sem erros');
    console.log('3. ✅ Mensagem salva sem erros');
    console.log('4. ✅ Webhook processado com sucesso');
    
    console.log('\n🚀 Agora envie uma mensagem real do seu WhatsApp!');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar
testFinalMessage();
