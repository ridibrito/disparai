import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNativeNotifications } from './useNativeNotifications';

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'contact' | 'ai' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  contact_id: string;
  last_message_content?: string;
  last_message_created_at?: string;
  unread_count: number;
  contacts?: {
    name: string;
    phone: string;
  };
}

interface UseGlobalNotificationsProps {
  userId?: string;
  onNewMessage?: (message: Message, conversation: Conversation) => void;
  onNewConversation?: (conversation: Conversation) => void;
}

export function useGlobalNotifications({
  userId,
  onNewMessage,
  onNewConversation
}: UseGlobalNotificationsProps) {
  const supabase = createClientComponentClient();
  const { showNotification, updateBadge, updateTitle, requestPermission } = useNativeNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [reconnectKey, setReconnectKey] = useState(0);
  
  // Refs para callbacks estáveis
  const onNewMessageRef = useRef(onNewMessage);
  const onNewConversationRef = useRef(onNewConversation);
  
  // Controle para evitar notificações duplicadas
  const processedMessagesRef = useRef<Set<string>>(new Set());
  
  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  
  useEffect(() => {
    onNewConversationRef.current = onNewConversation;
  }, [onNewConversation]);

  // Callbacks estáveis para evitar reconexões
  const handleNewMessage = useCallback(async (message: Message, conversation: Conversation) => {
    console.log('🔔 handleNewMessage chamado:', { message, conversation });
    
    // Atualizar contador de não lidas
    setUnreadCount(prev => {
      const newCount = prev + 1;
      updateBadge(newCount);
      updateTitle(newCount);
      return newCount;
    });

    // Mostrar notificação nativa
    console.log('🔔 Disparando notificação nativa...');
    await showNotification({
      title: conversation.contacts?.name || 'Contato',
      body: message.content.length > 50 
        ? `${message.content.substring(0, 50)}...` 
        : message.content,
      icon: '/icone.png',
      badge: '/icone.png',
      tag: `conversation-${conversation.id}`,
      data: {
        conversationId: conversation.id,
        messageId: message.id,
        contactName: conversation.contacts?.name,
        contactPhone: conversation.contacts?.phone
      }
    });
    console.log('🔔 Notificação nativa disparada!');

    // Chamar callback se fornecido
    if (onNewMessageRef.current) {
      onNewMessageRef.current(message, conversation);
    }
  }, [showNotification, updateBadge, updateTitle]);

  const handleNewConversation = useCallback(async (conversation: Conversation) => {
    // Atualizar contador de não lidas
    setUnreadCount(prev => {
      const newCount = prev + 1;
      updateBadge(newCount);
      updateTitle(newCount);
      return newCount;
    });

    // Mostrar notificação nativa
    await showNotification({
      title: 'Nova conversa iniciada',
      body: `Conversa com ${conversation.contacts?.name} (${conversation.contacts?.phone})`,
      icon: '/icone.png',
      badge: '/icone.png',
      tag: `new-conversation-${conversation.id}`,
      data: {
        conversationId: conversation.id,
        contactName: conversation.contacts?.name,
        contactPhone: conversation.contacts?.phone,
        isNewConversation: true
      }
    });

    // Chamar callback se fornecido
    if (onNewConversationRef.current) {
      onNewConversationRef.current(conversation);
    }
  }, [showNotification, updateBadge, updateTitle]);

  useEffect(() => {
    console.log('🔍 Debug - useEffect executado, userId:', userId, 'tipo:', typeof userId);
    
    if (!userId) {
      console.log('🔍 Debug - userId não disponível, aguardando...');
      return;
    }

    console.log('🔍 Debug - Iniciando polling para userId:', userId);

    // Usar polling em vez de Realtime por enquanto
    let pollInterval: NodeJS.Timeout;
    
    const pollForNewMessages = async () => {
      try {
        // Buscar mensagens não lidas dos últimos 30 segundos
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
        
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender,
            content,
            created_at,
            conversations!inner(
              id,
              contact_id,
              last_message_content,
              last_message_created_at,
              unread_count,
              contacts!inner(name, phone)
            )
          `)
          .eq('sender', 'contact')
          .gte('created_at', thirtySecondsAgo)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar mensagens:', error);
          return;
        }

        if (messages && messages.length > 0) {
          console.log('🔔 Mensagens encontradas via polling:', messages.length);
          
          for (const message of messages) {
            // Verificar se a mensagem já foi processada
            if (processedMessagesRef.current.has(message.id)) {
              console.log('⏭️ Mensagem já processada:', message.id);
              continue;
            }
            
            const conversation = message.conversations;
            if (conversation) {
              // Marcar mensagem como processada
              processedMessagesRef.current.add(message.id);
              console.log('✅ Processando nova mensagem:', message.id);
              await handleNewMessage(message, conversation);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error);
      }
    };

    // Executar polling a cada 5 segundos
    pollInterval = setInterval(pollForNewMessages, 5000);
    
    // Limpar cache de mensagens processadas a cada 5 minutos
    const cleanupInterval = setInterval(() => {
      processedMessagesRef.current.clear();
      console.log('🧹 Cache de mensagens processadas limpo');
    }, 5 * 60 * 1000);
    
    // Executar imediatamente
    pollForNewMessages();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
    };
  }, [userId]); // Remover reconnectKey do polling

  // Função para marcar mensagens como lidas
  const markAsRead = (conversationId?: string) => {
    if (conversationId) {
      // Marcar conversa específica como lida
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      // Marcar todas como lidas
      setUnreadCount(0);
    }
    
    updateBadge(Math.max(0, unreadCount - (conversationId ? 1 : unreadCount)));
    updateTitle(Math.max(0, unreadCount - (conversationId ? 1 : unreadCount)));
  };

  // Função para testar notificações
  const testNotification = async () => {
    console.log('🧪 Testando notificação...');
    await showNotification({
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste do Disparai',
      icon: '/icone.png',
      badge: '/icone.png',
      tag: 'test-notification',
      data: { test: true }
    });
  };

  return {
    unreadCount,
    markAsRead,
    testNotification
  };
}
