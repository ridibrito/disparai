'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalNotifications } from './useGlobalNotifications';

/**
 * Hook para inicializar o sistema global de notificações
 * Deve ser usado em qualquer página que precise de notificações de mensagens
 */
export function useGlobalNotificationSystem() {
  const { user } = useAuth();
  
  // Inicializar o sistema de notificações globais
  useGlobalNotifications({
    userId: user?.id,
    onNewMessage: (message, conversation) => {
      console.log('🔔 Nova mensagem recebida globalmente:', { message, conversation });
    },
    onNewConversation: (conversation) => {
      console.log('🔔 Nova conversa criada globalmente:', conversation);
    }
  });

  // Log para debug
  useEffect(() => {
    if (user?.id) {
      console.log('🔔 Sistema de notificações globais inicializado para usuário:', user.id);
    } else {
      console.log('🔔 Usuário não encontrado, sistema de notificações não inicializado');
    }
  }, [user?.id]);
}
