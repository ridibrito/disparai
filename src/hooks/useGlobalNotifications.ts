import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNativeNotifications } from './useNativeNotifications';
import { useNotifications } from '@/contexts/NotificationContext';

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
  attendance_type?: 'human' | 'ai' | 'transferred';
  attendance_status?: 'pending' | 'in_progress' | 'completed' | 'transferred';
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
  const { addNotification } = useNotifications();
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
    console.log('🔍 Tipo de atendimento:', conversation.attendance_type);
    
    // Só notificar se for atendimento humano (transferred ou human)
    const shouldNotify = conversation.attendance_type === 'transferred' || conversation.attendance_type === 'human';
    
    if (shouldNotify) {
      console.log('🔔 Enviando notificação - atendimento humano');
      
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

      // Adicionar notificação no sistema de notificações
      addNotification({
        type: 'message',
        title: `Nova mensagem de ${conversation.contacts?.name || 'Contato'}`,
        message: message.content.length > 100 
          ? `${message.content.substring(0, 100)}...` 
          : message.content,
        conversationId: conversation.id,
        contactName: conversation.contacts?.name,
        contactPhone: conversation.contacts?.phone
      });
      console.log('🔔 Notificação adicionada ao sistema!');
    } else {
      console.log('🔕 Não notificando - atendimento com IA');
    }

    // Chamar callback se fornecido (sempre, para atualizar a UI)
    if (onNewMessageRef.current) {
      onNewMessageRef.current(message, conversation);
    }
  }, [showNotification, updateBadge, updateTitle, addNotification]);

  const handleNewConversation = useCallback(async (conversation: Conversation) => {
    console.log('🔔 handleNewConversation chamado:', conversation);
    console.log('🔍 Tipo de atendimento:', conversation.attendance_type);
    
    // Só notificar se for atendimento humano (transferred ou human)
    const shouldNotify = conversation.attendance_type === 'transferred' || conversation.attendance_type === 'human';
    
    if (shouldNotify) {
      console.log('🔔 Enviando notificação - nova conversa com atendimento humano');
      
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
    } else {
      console.log('🔕 Não notificando - nova conversa com IA');
    }

    // Chamar callback se fornecido (sempre, para atualizar a UI)
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
        // console.log('🔍 Polling executado para usuário:', userId); // Log removido para reduzir spam
        
        // Buscar mensagens não lidas dos últimos 5 minutos
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        // Primeiro buscar a organização do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .single();

        if (!(userData as any)?.organization_id) {
          console.log('🔍 Debug - Usuário sem organização');
          return;
        }

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
              user_id,
              organization_id,
              last_message_content,
              last_message_created_at,
              unread_count,
              contacts!inner(name, phone)
            )
          `)
          .eq('sender', 'contact')
          .eq('conversations.organization_id', (userData as any).organization_id)
          .eq('conversations.user_id', userId)
          .gte('created_at', fiveMinutesAgo)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar mensagens:', error);
          return;
        }

        if (messages && messages.length > 0) {
          console.log('🔔 Mensagens encontradas via polling:', messages.length);
          
          // Filtrar apenas mensagens não processadas
          const newMessages = (messages as any[]).filter(msg => !processedMessagesRef.current.has(msg.id));
          
          if (newMessages.length === 0) {
            console.log('⏭️ Nenhuma mensagem nova para processar');
            return;
          }
          
          console.log('🔔 Novas mensagens para processar:', newMessages.length);
          
          for (const message of newMessages) {
            const conversation = (message as any).conversations;
            if (conversation) {
              // Marcar mensagem como processada ANTES de processar
              processedMessagesRef.current.add((message as any).id);
              console.log('✅ Processando nova mensagem:', (message as any).id);
              await handleNewMessage(message, conversation);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error);
      }
    };

    // Executar polling a cada 30 segundos (menos agressivo)
    pollInterval = setInterval(pollForNewMessages, 30000);
    
    // Limpar cache de mensagens processadas a cada 1 hora
    const cleanupInterval = setInterval(() => {
      processedMessagesRef.current.clear();
      console.log('🧹 Cache de mensagens processadas limpo');
    }, 60 * 60 * 1000);
    
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
