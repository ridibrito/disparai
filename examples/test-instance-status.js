// Teste para verificar o status da instância
const instanceKey = 'coruss-whatsapp-01'; // Substitua pela sua instância

async function testInstanceStatus() {
  try {
    console.log('🧪 Testando status da instância:', instanceKey);
    
    const response = await fetch('http://localhost:3000/api/mega/get-instance-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceKey
      }),
    });

    const result = await response.json();
    
    console.log('📊 Resposta da API:');
    console.log('Status HTTP:', response.status);
    console.log('Dados:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.instance) {
      console.log('\n📱 Status da instância:');
      console.log('- Nome:', result.data.instance.instanceName);
      console.log('- Status:', result.data.instance.status);
      console.log('- QR Code:', result.data.instance.qrcode ? 'Disponível' : 'Não disponível');
      console.log('- Código de Pareamento:', result.data.instance.pairingCode);
      
      if (result.data.instance.deviceInfo) {
        console.log('\n📱 Informações do dispositivo:');
        console.log('- Dispositivo:', result.data.instance.deviceInfo.device);
        console.log('- Bateria:', result.data.instance.deviceInfo.battery + '%');
        console.log('- Conectado:', result.data.instance.deviceInfo.plugged ? 'Sim' : 'Não');
        console.log('- Plataforma:', result.data.instance.deviceInfo.platform);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testInstanceStatus();
