import { useEffect, useState } from 'react';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

interface UseNativeNotificationsProps {
  onNotificationClick?: (data: any) => void;
}

export function useNativeNotifications({ onNotificationClick }: UseNativeNotificationsProps = {}) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão para notificações:', error);
      return false;
    }
  };

  // Mostrar notificação
  const showNotification = async (data: NotificationData): Promise<void> => {
    console.log('🔔 showNotification chamado com:', data);
    
    if (!isSupported) {
      console.warn('Notificações não suportadas neste navegador');
      return;
    }

    // Solicitar permissão se necessário
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.warn('Permissão para notificações negada');
      return;
    }

    try {
      // Fechar notificações anteriores com a mesma tag
      if (data.tag) {
        // Fechar notificações com a mesma tag
        const existingNotifications = await navigator.serviceWorker?.getRegistrations();
        // Nota: Em um ambiente real, você usaria um service worker para gerenciar isso
      }

      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icone.png', // Usar o ícone do projeto
        badge: data.badge || '/icone.png',
        tag: data.tag || 'disparai-message',
        data: data.data,
        requireInteraction: false, // Não requer interação do usuário
        silent: false, // Permitir som
        vibrate: [200, 100, 200], // Vibração no mobile
      });

      // Configurar clique na notificação
      notification.onclick = () => {
        console.log('🔔 Notificação clicada:', data);
        window.focus(); // Focar na janela
        notification.close(); // Fechar a notificação
        
        // Marcar como lida se for uma conversa específica
        if (data.data?.conversationId) {
          console.log('🔔 Disparando evento markConversationAsRead para:', data.data.conversationId);
          // Disparar evento customizado para marcar como lida
          window.dispatchEvent(new CustomEvent('markConversationAsRead', {
            detail: { conversationId: data.data.conversationId }
          }));
        }
        
        if (onNotificationClick && data.data) {
          onNotificationClick(data.data);
        }
      };

      // Fechar automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  };

  // Atualizar contador na aba do navegador
  const updateBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          navigator.setAppBadge(count);
        } else {
          navigator.clearAppBadge();
        }
      } catch (error) {
        console.error('Erro ao atualizar badge:', error);
      }
    }
  };

  // Atualizar título da aba
  const updateTitle = (count: number, originalTitle: string = 'Disparai') => {
    if (count > 0) {
      document.title = `(${count}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    updateBadge,
    updateTitle,
  };
}
