'use client';

import { MessageSquare, Send, Phone, Search, Paperclip, MoreVertical, Smile, Mic, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';

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
}

export function ConversationsPageWithUser() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchConversations() {
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          user_id,
          status,
          created_at,
          updated_at,
          contacts ( name, phone ),
          messages ( content, created_at, sender )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        const processedConversations = data.map((conv: any) => {
          const lastMessage = conv.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          return {
            ...conv,
            last_message_content: lastMessage?.content || '',
            last_message_created_at: lastMessage?.created_at || '',
          };
        });
        setConversations(processedConversations);
        if (processedConversations.length > 0) {
          setSelectedConversation(processedConversations[0]);
        }
      }
      setLoadingConversations(false);
    }

    fetchConversations();

    const channel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (selectedConversation) {
        setLoadingMessages(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
        } else {
          setMessages(data || []);
        }
        setLoadingMessages(false);
      }
    }

    fetchMessages();

    if (selectedConversation) {
      const messageChannel = supabase
        .channel(`messages_for_${selectedConversation.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` },
          (payload) => {
            setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: 'temp-' + Date.now(),
        conversation_id: selectedConversation.id,
        sender: 'user',
        content: messageToSend,
        created_at: new Date().toISOString(),
      },
    ]);

    const response = await fetch(`/api/conversations/${selectedConversation.contact_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageToSend }),
    });

    if (!response.ok) {
      console.error('Failed to send message');
    }
  };

  const getInitial = (name: string) => (name?.trim()[0] || '?').toUpperCase();

  return (
    <div className="space-y-0 h-full">
      <div className="bg-white text-gray-900 overflow-hidden full-bleed-chat">
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              placeholder="Pesquisar ou começar uma nova conversa"
              className="w-full pl-8 pr-3 py-2 rounded-md text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Sidebar - Lista de Conversas */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center text-gray-500">Carregando conversas...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhuma conversa encontrada</div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-white shadow-sm border border-gray-200'
                        : 'hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitial(conversation.contacts.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.contacts.name}
                          </h3>
                          <span className="text-xs text-gray-500">
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
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitial(selectedConversation.contacts.name)}
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">
                        {selectedConversation.contacts.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.contacts.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500">Carregando mensagens...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma mensagem ainda</div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
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
    </div>
  );
}