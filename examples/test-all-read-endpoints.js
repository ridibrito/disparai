const fetch = require('node-fetch');

async function testAllReadEndpoints() {
  const baseUrl = 'https://teste8.megaapi.com.br';
  const instanceKey = 'coruss-whatsapp-01';
  const jid = '556183555195@s.whatsapp.net';
  const token = 'SEU_TOKEN_AQUI'; // Substitua pelo seu token
  
  const endpoints = [
    `/rest/instance/${instanceKey}/readMessage`,
    `/rest/chat/${instanceKey}/readMessage`,
    `/rest/chat/${instanceKey}/readChat`,
    `/rest/message/read`,
    `/message/read`
  ];
  
  const payloads = [
    { jid: jid },
    { remoteJid: jid },
    { instance_key: instanceKey, jid: jid },
    { instance_key: instanceKey, remoteJid: jid }
  ];
  
  console.log('🧪 Testando todos os endpoints possíveis...\n');
  
  for (const endpoint of endpoints) {
    console.log(`\n🔗 Testando endpoint: ${endpoint}`);
    
    for (const payload of payloads) {
      try {
        console.log(`📤 Payload:`, payload);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        console.log(`📥 Status: ${response.status}`);
        console.log(`📥 Resposta: ${responseText.substring(0, 200)}...`);
        
        if (response.ok) {
          console.log('✅ SUCESSO! Este endpoint funciona!');
          return { endpoint, payload };
        }
        
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ Nenhum endpoint funcionou');
}

testAllReadEndpoints();
