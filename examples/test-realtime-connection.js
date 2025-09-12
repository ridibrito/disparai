// Script para testar conexão Supabase Realtime no navegador
// Execute este código no console do navegador (F12) na página de conversas

console.log('🧪 Testando conexão Supabase Realtime...');

// Verificar se o Supabase está disponível
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase disponível no window');
} else {
  console.log('❌ Supabase não encontrado no window');
}

// Verificar se há dados de autenticação
if (typeof window !== 'undefined' && window.localStorage) {
  const authData = localStorage.getItem('sb-disparai-auth-token');
  if (authData) {
    console.log('✅ Token de autenticação encontrado');
    try {
      const parsed = JSON.parse(authData);
      console.log('📋 Dados do usuário:', parsed);
    } catch (e) {
      console.log('❌ Erro ao parsear token:', e);
    }
  } else {
    console.log('❌ Token de autenticação não encontrado');
  }
}

// Verificar se há erros no console
console.log('🔍 Verifique se há erros no console acima');
console.log('📋 Se não há logs de subscription, verifique:');
console.log('1. Se o usuário está logado');
console.log('2. Se há erros no console');
console.log('3. Se o Supabase está configurado corretamente');
console.log('4. Se o Realtime está habilitado no Supabase');

// Testar notificação manual
console.log('🔔 Testando notificação manual...');
if ('Notification' in window && Notification.permission === 'granted') {
  const notification = new Notification('Teste Manual', {
    body: 'Esta é uma notificação de teste manual!',
    icon: '/icone.png'
  });
  
  notification.onclick = () => {
    console.log('✅ Notificação manual clicada!');
    notification.close();
  };
  
  setTimeout(() => {
    notification.close();
  }, 3000);
} else {
  console.log('❌ Notificações não disponíveis ou permissão negada');
}
