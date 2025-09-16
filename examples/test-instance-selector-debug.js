// Teste para debugar o WhatsAppInstanceSelector
async function testInstanceSelectorDebug() {
  try {
    console.log('🧪 Testando dados do WhatsAppInstanceSelector');
    
    // 1. Testar API de conexões
    console.log('\n1️⃣ Testando API de conexões...');
    const connectionsResponse = await fetch('http://localhost:3000/api/connections');
    const connectionsData = await connectionsResponse.json();
    
    console.log('Conexões encontradas:', connectionsData.connections?.length || 0);
    if (connectionsData.connections) {
      connectionsData.connections.forEach((conn, index) => {
        console.log(`\nConexão ${index + 1}:`);
        console.log('- ID:', conn.id);
        console.log('- Nome:', conn.name);
        console.log('- Tipo:', conn.type);
        console.log('- Status:', conn.status);
        console.log('- is_active:', conn.is_active);
        console.log('- instance_id:', conn.instance_id);
        console.log('- phone_number:', conn.phone_number);
      });
    }
    
    // 2. Testar API de status para cada instância
    console.log('\n2️⃣ Testando API de status para cada instância...');
    if (connectionsData.connections) {
      for (const conn of connectionsData.connections) {
        if (conn.instance_id) {
          console.log(`\nTestando instância: ${conn.instance_id}`);
          
          const statusResponse = await fetch('http://localhost:3000/api/mega/get-instance-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              instanceKey: conn.instance_id
            }),
          });
          
          const statusData = await statusResponse.json();
          console.log('- Status da API:', statusData.data?.instance?.status);
          console.log('- Sucesso:', statusData.success);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testInstanceSelectorDebug();
