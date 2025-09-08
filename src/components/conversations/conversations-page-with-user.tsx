'use client';

import { MessageSquare, Send, Phone, Search, Paperclip, MoreVertical, Smile, Mic, CheckCheck, Plus, RefreshCw, Pencil, Video, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { NewConversationModal } from './new-conversation-modal';
import toast from 'react-hot-toast';

interface Conversation {
  id: string;
  contact_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  contacts: {
    name: string;
    phone: string;
  };
  last_message_content?: string;
  last_message_created_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'contact' | 'ai';
  content: string;
  created_at: string;
  media_url?: string;
  status?: string;
}

export function ConversationsPageWithUser() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchConversations() {
      setLoadingConversations(true);
      try {
        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (data.success) {
          setConversations(data.conversations);
          if (data.conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(data.conversations[0]);
          }
        } else {
          console.error('Error fetching conversations:', data.error);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
      setLoadingConversations(false);
    }

    async function fetchMessages() {
      if (selectedConversation) {
        setLoadingMessages(true);
        try {
          const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
          const data = await response.json();

          if (data.success) {
            setMessages(data.messages || []);
          } else {
            console.error('Error fetching messages:', data.error);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
        setLoadingMessages(false);
      }
    }

    fetchConversations();

    // Configurar realtime para conversas e mensagens
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations' 
        }, 
        (payload) => {
          console.log('🔄 [REALTIME] Mudança em conversas:', payload);
          fetchConversations(); // Recarregar conversas quando houver mudanças
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          console.log('🔄 [REALTIME] Mudança em mensagens:', payload);
          // Se a mensagem é da conversa atual, atualizar mensagens
          if (selectedConversation && payload.new && 'conversation_id' in payload.new && payload.new.conversation_id === selectedConversation.id) {
            fetchMessages();
          }
          // Sempre recarregar conversas para atualizar última mensagem
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
    };
  }, [selectedConversation]);

  // useEffect separado para carregar mensagens quando a conversa selecionada mudar
  useEffect(() => {
    async function fetchMessages() {
      if (selectedConversation) {
        setLoadingMessages(true);
        try {
          const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
          const data = await response.json();

          if (data.success) {
            setMessages(data.messages || []);
          } else {
            console.error('Error fetching messages:', data.error);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    // Adicionar mensagem temporária para feedback imediato
    const tempMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: selectedConversation.id,
      sender: 'user' as const,
      content: messageToSend,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();

      if (data.success) {
        // Remover mensagem temporária e adicionar a real
        setMessages((prevMessages) => [
          ...prevMessages.filter(msg => msg.id !== tempMessage.id),
          data.message
        ]);
      } else {
        // Remover mensagem temporária em caso de erro
        setMessages((prevMessages) => 
          prevMessages.filter(msg => msg.id !== tempMessage.id)
        );
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      // Remover mensagem temporária em caso de erro
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== tempMessage.id)
      );
      console.error('Failed to send message:', error);
    }
  };

  const handleNewConversationCreated = (newConversation: any) => {
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
  };

  const handleSyncWhatsApp = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-whatsapp-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sincronização concluída! ${data.stats.synced_conversations} conversas processadas`);
        // Recarregar conversas
        const conversationsResponse = await fetch('/api/conversations');
        const conversationsData = await conversationsResponse.json();
        if (conversationsData.success) {
          setConversations(conversationsData.conversations);
        }
      } else {
        toast.error(data.error || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    }
    setSyncing(false);
  };

  const getInitial = (name: string) => (name?.trim()[0] || '?').toUpperCase();

  return (
    <div className="h-screen bg-white overflow-hidden">
      <div className="text-gray-900 h-full flex flex-col">
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {/* Sidebar do título */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                  title="Nova conversa"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSyncWhatsApp}
                  disabled={syncing}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sincronizar conversas do WhatsApp"
                >
                  <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  placeholder="Pesquisar ou começar uma nova conversa"
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          
          {/* Área do cabeçalho da conversa */}
          <div className="flex-1 bg-gray-50 px-4 py-2">
            {selectedConversation ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitial(selectedConversation.contacts.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-medium text-gray-900">
                    {selectedConversation.contacts.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.contacts.phone}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                    <Search className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <p className="text-gray-500 text-sm">Selecione uma conversa para começar</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar - Lista de Conversas */}
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
            {loadingConversations ? (
              <div className="p-4 text-center text-gray-500">Carregando conversas...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhuma conversa encontrada</div>
            ) : (
              <div>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {getInitial(conversation.contacts.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {conversation.contacts.name}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2">
                            {conversation.last_message_created_at
                              ? new Date(conversation.last_message_created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message_content || 'Nenhuma mensagem'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {selectedConversation ? (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 relative bg-gray-100 min-h-0">
                  {/* Padrão sutil de fundo */}
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '60px 60px'
                    }}
                  />
                  <div className="relative z-10">
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">Carregando mensagens...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500">Nenhuma mensagem ainda</div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} relative z-10 mb-1`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-3 py-1 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-green-500 text-white ml-auto'
                                : 'bg-white text-gray-900 shadow-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end mt-0.5 gap-1 ${
                              message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {message.sender === 'user' && (
                                <div className="flex">
                                  <CheckCheck className="h-3 w-3 text-green-100" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Message Input - Fixo no bottom */}
                <div className="flex-shrink-0 px-3 py-2 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-1">
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                      <Smile className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Mensagem"
                        className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                  <p className="text-gray-500">Escolha uma conversa para começar a conversar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nova Conversa */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleNewConversationCreated}
      />
    </div>
  );
}