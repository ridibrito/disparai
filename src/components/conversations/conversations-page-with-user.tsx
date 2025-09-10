'use client';

import { useState, useEffect } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { 
  Search, 
  MoreVertical, 
  Plus, 
  RefreshCw, 
  MessageCircle, 
  Smile, 
  Paperclip, 
  Mic
} from 'lucide-react';
// import { NewConversationModal } from './new-conversation-modal';

interface Contact {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'contact';
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  contact_id: string;
  last_message_content: string | null;
  last_message_created_at: string;
  created_at: string;
  contacts: Contact;
}

export default function ConversationsPageWithUser() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Mock data para desenvolvimento
  const mockNames = ['João Silva', 'Maria Santos', 'Pedro Costa'];
  const sampleMessages = [
    'Olá! Como posso ajudar?',
    'Obrigado pelo contato!',
    'Vou verificar e retorno em breve.',
    'Perfeito! Vamos agendar.',
    'Tenho uma proposta para você.'
  ];

  const generateMockConversations = (): Conversation[] => {
    return mockNames.map((name, index) => {
      const minutesAgo = (index + 1) * 5;
      return {
        id: `mock-${index + 1}`,
        contact_id: `contact-${index + 1}`,
        last_message_content: sampleMessages[index % sampleMessages.length],
        last_message_created_at: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
        contacts: {
          id: `contact-${index + 1}`,
          name: name,
          phone: `+55 11 9999-${String(index + 1).padStart(4, '0')}`,
          created_at: new Date().toISOString()
        }
      } as Conversation;
    });
  };

  const mockConversations = generateMockConversations();

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'Olá! Como posso ajudar você hoje?',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-2',
      conversation_id: 'mock-1',
      sender: 'user',
      content: 'Oi! Estou interessado nos seus serviços. Pode me enviar mais informações?',
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-3',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'Claro! Vou enviar um catálogo completo com todos os nossos serviços e preços.',
      created_at: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-4',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'Aqui está o link: https://exemplo.com/catalogo',
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-5',
      conversation_id: 'mock-1',
      sender: 'user',
      content: 'Perfeito! Vou dar uma olhada e retorno com minhas dúvidas.',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-6',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'Ótimo! Estou à disposição para qualquer esclarecimento. 😊',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-7',
      conversation_id: 'mock-1',
      sender: 'user',
      content: 'Tenho algumas perguntas sobre os preços. Vocês fazem desconto para compras em grande quantidade?',
      created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-8',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'Sim! Temos descontos progressivos. Para pedidos acima de R$ 10.000, oferecemos 15% de desconto.',
      created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-9',
      conversation_id: 'mock-1',
      sender: 'user',
      content: 'Interessante! E qual é o prazo de entrega?',
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-10',
      conversation_id: 'mock-1',
      sender: 'contact',
      content: 'O prazo padrão é de 7 a 10 dias úteis. Para pedidos urgentes, podemos fazer em 3 dias com taxa adicional.',
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      status: 'delivered'
    },
    {
      id: 'msg-11',
      conversation_id: 'mock-1',
      sender: 'user',
      content: 'Perfeito! Vou analisar tudo e retorno com uma proposta.',
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      status: 'delivered'
    }
  ];
  
  // const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchConversations() {
      setLoadingConversations(true);
      // Usar dados mockados para desenvolvimento
      setTimeout(() => {
        setConversations(mockConversations);
        if (mockConversations.length > 0) {
          setSelectedConversation(mockConversations[0]);
          console.log('Conversa selecionada:', mockConversations[0]);
        }
        setLoadingConversations(false);
      }, 500);
    }

    fetchConversations();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (selectedConversation) {
        setLoadingMessages(true);
        // Usar dados mockados para desenvolvimento
        setTimeout(() => {
          if (selectedConversation.id === 'mock-1') {
            setMessages(mockMessages);
          } else {
            setMessages([]);
          }
          setLoadingMessages(false);
        }, 300);
      }
    }

    fetchMessages();
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.contacts.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.contacts.phone.includes(searchTerm) ||
    (conversation.last_message_content && conversation.last_message_content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      conversation_id: selectedConversation.id,
      sender: 'user' as const,
      content: newMessage.trim(),
      status: 'sent' as const
    };

    // Adicionar mensagem localmente
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      ...messageData,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar mensagem com ID real
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...msg, id: data.message.id, status: 'delivered' } : msg
          )
        );
      } else {
        toast.error('Erro ao enviar mensagem');
        // Remover mensagem temporária em caso de erro
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="full-bleed-chat bg-white flex flex-row overflow-hidden" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Sidebar - Lista de Conversas (FIXA) */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col h-full flex-shrink-0">
        {/* Header da sidebar (FIXO) */}
        <div className="flex-shrink-0 h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
              title="Nova conversa"
            >
              <Plus className="h-5 w-5" />
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

        {/* Barra de pesquisa (FIXA) */}
        <div className="flex-shrink-0 p-2 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar ou começar uma nova conversa"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de conversas (ROLÁVEL) */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loadingConversations ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {getInitial(conversation.contacts.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.contacts.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conversation.last_message_created_at)}
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
      </div>

      {/* Main Chat Area (FIXA) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        <div className="bg-red-500 text-white p-4">
          TESTE: Área de chat deve aparecer aqui
        </div>
        <div className="flex-1 bg-blue-100 p-4">
          <h2>Chat funcionando!</h2>
          <p>Conversa selecionada: {selectedConversation?.contacts?.name || 'Nenhuma'}</p>
        </div>
        <div className="bg-green-500 text-white p-4">
          Input de mensagem
        </div>
      </div>

      {/* Modal para nova conversa */}
      {/* {showNewConversationModal && (
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleNewConversationCreated}
        />
      )} */}
    </div>
  );
}