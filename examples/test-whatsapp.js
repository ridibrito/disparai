// Exemplo de teste para WhatsApp Cloud API
// Execute: node examples/test-whatsapp.js

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/whatsapp';

async function testWhatsApp() {
  try {
    console.log('🧪 Testando integração WhatsApp...\n');

    // 1. Testar envio de template
    console.log('1️⃣ Enviando template...');
    const templateResponse = await axios.post(`${API_BASE}/send`, {
      kind: 'template',
      to: ['+5511999999999'], // Substitua por um número real
      template: {
        name: 'boas_vindas',
        language: 'pt_BR',
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: 'João Silva'
              }
            ]
          }
        ]
      }
    });
    console.log('✅ Template enviado:', templateResponse.data);

    // 2. Testar envio de texto (se a janela estiver aberta)
    console.log('\n2️⃣ Enviando texto...');
    const textResponse = await axios.post(`${API_BASE}/send`, {
      kind: 'text',
      to: ['+5511999999999'], // Substitua por um número real
      text: 'Olá! Como posso ajudar você hoje?'
    });
    console.log('✅ Texto enviado:', textResponse.data);

    // 3. Testar envio em lote
    console.log('\n3️⃣ Enviando em lote...');
    const batchResponse = await axios.post(`${API_BASE}/send`, {
      kind: 'template',
      to: [
        '+5511999999999',
        '+5511888888888',
        '+5511777777777'
      ],
      template: {
        name: 'promocao',
        language: 'pt_BR'
      }
    });
    console.log('✅ Lote enviado:', batchResponse.data);

    console.log('\n🎉 Todos os testes passaram!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Dica: Verifique se os números estão no formato correto (+5511999999999)');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Dica: Verifique se o worker está rodando (pnpm worker:broadcast)');
    }
  }
}

// Executar teste
testWhatsApp();
