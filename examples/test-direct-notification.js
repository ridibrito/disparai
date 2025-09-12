// Script para testar notificações diretamente no navegador
// Execute este código no console do navegador (F12) na página de conversas

console.log('🧪 Testando notificações diretamente...');

// Função para testar notificação
function testNotification() {
  if ('Notification' in window) {
    console.log('✅ Navegador suporta notificações');
    console.log('📋 Status atual:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      console.log('🎉 Criando notificação de teste...');
      
      const notification = new Notification('Teste Disparai', {
        body: 'Esta é uma notificação de teste do Disparai!',
        icon: '/icone.png',
        badge: '/icone.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      });
      
      notification.onclick = () => {
        console.log('✅ Notificação clicada!');
        window.focus();
        notification.close();
      };
      
      notification.onshow = () => {
        console.log('✅ Notificação exibida!');
      };
      
      notification.onerror = (error) => {
        console.error('❌ Erro na notificação:', error);
      };
      
      // Fechar automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
        console.log('🔔 Notificação fechada automaticamente');
      }, 5000);
      
    } else if (Notification.permission === 'default') {
      console.log('🔔 Solicitando permissão...');
      Notification.requestPermission().then(permission => {
        console.log('📋 Nova permissão:', permission);
        if (permission === 'granted') {
          testNotification(); // Tentar novamente
        }
      });
    } else {
      console.log('❌ Permissão negada para notificações');
      console.log('💡 Para ativar notificações:');
      console.log('1. Clique no ícone de notificação na barra de endereços');
      console.log('2. Ou vá em Configurações > Privacidade > Notificações');
    }
  } else {
    console.log('❌ Navegador não suporta notificações');
  }
}

// Executar teste
testNotification();

// Verificar se há erros no console
console.log('🔍 Verifique se há erros no console acima');
console.log('📋 Se não apareceu notificação, verifique:');
console.log('1. Se aceitou as permissões');
console.log('2. Se o navegador está em foco');
console.log('3. Se há erros no console');
console.log('4. Se o banner de permissão apareceu na página');

// Verificar se o usuário está logado
console.log('🔍 Verificando se o usuário está logado...');
if (typeof window !== 'undefined' && window.localStorage) {
  const authData = localStorage.getItem('sb-disparai-auth-token');
  if (authData) {
    console.log('✅ Usuário parece estar logado');
  } else {
    console.log('❌ Usuário não parece estar logado');
  }
}
