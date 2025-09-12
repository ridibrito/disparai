const fetch = require('node-fetch');

async function testReadReceipt() {
  try {
    console.log('🧪 Testando confirmação de leitura...');
    
    const payload = {
      remoteJid: '556183555195@s.whatsapp.net'
    };
    
    console.log('📤 Payload:', payload);
    
    const response = await fetch('https://api.megaapi.com.br/rest/chat/coruss-whatsapp-01/readMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN_AQUI', // Substitua pelo seu token
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 Status:', response.status);
    console.log('📥 Resposta:', responseText);
    
    if (response.ok) {
      console.log('✅ Confirmação de leitura enviada com sucesso!');
    } else {
      console.log('❌ Erro ao enviar confirmação de leitura');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testReadReceipt();
