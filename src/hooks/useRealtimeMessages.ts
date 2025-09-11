import { useEffect, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'contact' | 'ai' | 'system';
  content: string;
  media_url?: string;
  type?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  contact_id: string;
  last_message_content?: string;
  last_message_created_at?: string;
  unread_count: number;
  updated_at: string;
}

interface UseRealtimeMessagesProps {
  conversationId?: string;
  onNewMessage?: (message: Message) => void;
  onMessageStatusUpdate?: (messageId: string, status: string) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
}

export function useRealtimeMessages({
  conversationId,
  onNewMessage,
  onMessageStatusUpdate,
  onConversationUpdate
}: UseRealtimeMessagesProps) {
  const supabase = createClientComponentClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Inscrever-se nas mudanças de mensagens
    const messagesSubscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          if (onNewMessage) {
            onNewMessage(payload.new as Message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Mensagem atualizada:', payload);
          if (onMessageStatusUpdate) {
            onMessageStatusUpdate(payload.new.id, payload.new.status);
          }
        }
      )
      .subscribe();

    // Inscrever-se nas mudanças de conversas
    const conversationsSubscription = supabase
      .channel(`conversations-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Conversa atualizada:', payload);
          if (onConversationUpdate) {
            onConversationUpdate(payload.new as Conversation);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = { messagesSubscription, conversationsSubscription };

    return () => {
      messagesSubscription.unsubscribe();
      conversationsSubscription.unsubscribe();
    };
  }, [conversationId, onNewMessage, onMessageStatusUpdate, onConversationUpdate, supabase]);

  // Função para atualizar status de mensagem
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da mensagem');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
      throw error;
    }
  };

  return {
    updateMessageStatus
  };
}
