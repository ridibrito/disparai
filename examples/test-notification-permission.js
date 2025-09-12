// Script para testar notificações no navegador
// Execute este código no console do navegador (F12)

console.log('🧪 Testando notificações no navegador...');

// Verificar se o navegador suporta notificações
if ('Notification' in window) {
  console.log('✅ Navegador suporta notificações');
  console.log('📋 Status atual:', Notification.permission);
  
  // Solicitar permissão se necessário
  if (Notification.permission === 'default') {
    console.log('🔔 Solicitando permissão...');
    Notification.requestPermission().then(permission => {
      console.log('📋 Nova permissão:', permission);
      
      if (permission === 'granted') {
        // Testar notificação
        console.log('🎉 Testando notificação...');
        const notification = new Notification('Teste Disparai', {
          body: 'Esta é uma notificação de teste do Disparai!',
          icon: '/icone.png',
          badge: '/icone.png',
          tag: 'test-notification',
          requireInteraction: false,
          silent: false,
        });
        
        notification.onclick = () => {
          console.log('✅ Notificação clicada!');
          notification.close();
        };
        
        // Fechar automaticamente após 5 segundos
        setTimeout(() => {
          notification.close();
        }, 5000);
        
      } else {
        console.log('❌ Permissão negada para notificações');
      }
    });
  } else if (Notification.permission === 'granted') {
    console.log('✅ Permissão já concedida, testando notificação...');
    
    const notification = new Notification('Teste Disparai', {
      body: 'Esta é uma notificação de teste do Disparai!',
      icon: '/icone.png',
      badge: '/icone.png',
      tag: 'test-notification',
      requireInteraction: false,
      silent: false,
    });
    
    notification.onclick = () => {
      console.log('✅ Notificação clicada!');
      notification.close();
    };
    
    setTimeout(() => {
      notification.close();
    }, 5000);
    
  } else {
    console.log('❌ Permissão negada para notificações');
    console.log('💡 Para ativar notificações:');
    console.log('1. Clique no ícone de notificação na barra de endereços');
    console.log('2. Ou vá em Configurações > Privacidade > Notificações');
  }
} else {
  console.log('❌ Navegador não suporta notificações');
}

// Verificar se há erros no console
console.log('🔍 Verifique se há erros no console acima');
console.log('📋 Se não apareceu notificação, verifique:');
console.log('1. Se aceitou as permissões');
console.log('2. Se o navegador está em foco');
console.log('3. Se há erros no console');
console.log('4. Se o banner de permissão apareceu na página');
