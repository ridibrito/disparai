'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search,
  MoreVertical,
  Plus,
  RefreshCw,
  MessageCircle,
  Smile,
  Paperclip,
  Mic,
  Filter,
  Star,
  Archive,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  Image,
  AlertCircle,
  MessageSquare,
  Send
} from 'lucide-react';
import { NewConversationModalEnhanced } from './new-conversation-modal-enhanced';
import { EmojiPicker } from './emoji-picker';
import { TemplateSuggestions } from './template-suggestions';
import { whatsappAPI } from '@/services/whatsapp-api';
import { useTemplates } from '@/hooks/useTemplates';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useContactAvatar } from '@/hooks/useContactAvatar';

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
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

interface Conversation {
  id: string;
  contact_id: string;
  last_message_content: string | null;
  last_message_created_at: string;
  created_at: string;
  contacts: Contact;
  unread_count: number;
  has_attachments: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  // Novo campo para diferenciar tipo de atendimento
  attendance_type: 'human' | 'ai' | 'transferred';
  // Status do atendimento
  attendance_status: 'pending' | 'in_progress' | 'completed' | 'transferred';
}

export default function ConversationsPageReal() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    unreadOnly: false,
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
    hasAttachments: false
  });
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);
  const [templateSuggestions, setTemplateSuggestions] = useState<any[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'ai_active' | 'human'>('ai_active');
  const [aiFilter, setAiFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [humanFilter, setHumanFilter] = useState<'unanswered' | 'in_progress' | 'completed'>('unanswered');

  // Função para filtrar conversas baseado na aba ativa
  const getFilteredConversations = () => {
    let filtered = conversations;

    console.log('=== DEBUG FILTROS ===');
    console.log('Active tab:', activeTab);
    console.log('Total conversations:', conversations.length);
    console.log('Conversations data:', conversations.map(c => ({
      id: c.id,
      name: c.contacts.name,
      attendance_type: c.attendance_type,
      attendance_status: c.attendance_status
    })));

    if (activeTab === 'ai_active') {
      // Filtrar conversas ativas com IA (não transferidas)
      filtered = conversations.filter(conv => 
        conv.attendance_type === 'ai' && conv.attendance_status !== 'transferred'
      );
      
      console.log('AI Active filtered:', filtered.length);
      console.log('AI Active conversations:', filtered.map(c => ({
        id: c.id,
        name: c.contacts.name,
        attendance_type: c.attendance_type,
        attendance_status: c.attendance_status
      })));

      // Aplicar filtros específicos da IA ativa
      switch (aiFilter) {
        case 'pending':
          filtered = filtered.filter(conv => conv.attendance_status === 'pending');
          break;
        case 'completed':
          filtered = filtered.filter(conv => conv.attendance_status === 'completed');
          break;
        // 'all' não precisa de filtro adicional
      }
    } else if (activeTab === 'human') {
      // Filtrar conversas de atendimento humano (transferidas)
      filtered = conversations.filter(conv => 
        conv.attendance_type === 'transferred' || conv.attendance_type === 'human'
      );

      // Aplicar filtros específicos do atendimento humano
      switch (humanFilter) {
        case 'unanswered':
          filtered = filtered.filter(conv => conv.attendance_status === 'pending');
          break;
        case 'in_progress':
          filtered = filtered.filter(conv => conv.attendance_status === 'in_progress');
          break;
        case 'completed':
          filtered = filtered.filter(conv => conv.attendance_status === 'completed');
          break;
      }
    }

    // Aplicar filtros de busca (comum para ambas as abas)
    filtered = filtered.filter(conversation => {
      // Filtro de busca por texto
      const matchesSearch = !searchTerm || (
        conversation.contacts.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.contacts.phone.includes(searchTerm) ||
        (conversation.last_message_content && conversation.last_message_content.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Filtro de mensagens não lidas
      const matchesUnread = !searchFilters.unreadOnly || conversation.unread_count > 0;

      // Filtro de anexos
      const matchesAttachments = !searchFilters.hasAttachments || conversation.has_attachments;

      // Filtro de data
      const matchesDateRange = (() => {
        if (searchFilters.dateRange === 'all') return true;
        
        const now = new Date();
        const messageDate = new Date(conversation.last_message_created_at);
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
        
        switch (searchFilters.dateRange) {
          case 'today': return diffInHours <= 24;
          case 'week': return diffInHours <= 168; // 7 dias
          case 'month': return diffInHours <= 720; // 30 dias
          default: return true;
        }
      })();

      return matchesSearch && matchesUnread && matchesAttachments && matchesDateRange;
    });

    return filtered;
  };

  const filteredConversations = getFilteredConversations();

  // Função para transferir conversa da IA para atendimento humano
  const transferToHuman = async (conversationId: string) => {
    try {
      // Aqui você faria a chamada para a API para atualizar o status
      // Por enquanto, vamos simular a atualização local
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              attendance_type: 'transferred' as const,
              attendance_status: 'pending' as const
            }
          : conv
      );
      
      setConversations(updatedConversations);
      
      // Enviar notificação quando transferir para humano
      const transferredConversation = updatedConversations.find(conv => conv.id === conversationId);
      if (transferredConversation) {
        console.log('🔔 Notificação: Conversa transferida para atendimento humano', {
          conversationId,
          contactName: transferredConversation.contacts.name,
          lastMessage: transferredConversation.last_message_content
        });
        
        // Disparar evento customizado para notificação
        const event = new CustomEvent('conversationTransferredToHuman', {
          detail: {
            conversation: transferredConversation,
            message: 'Conversa transferida para atendimento humano'
          }
        });
        window.dispatchEvent(event);
      }
      
      toast.success('Conversa transferida para atendimento humano');
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
      toast.error('Erro ao transferir conversa');
    }
  };

  // Hook para gerenciar templates do banco de dados
  const { getQuickMessageTemplates, loading: templatesLoading } = useTemplates();
  const templatesFromDB = getQuickMessageTemplates();

  // Hook para atualizações em tempo real
  const { updateMessageStatus } = useRealtimeMessages({
    conversationId: selectedConversation?.id,
    onNewMessage: (message) => {
      // Adicionar nova mensagem recebida
      setMessages(prev => [...prev, message]);
      
      // Atualizar conversa na lista
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversation_id 
          ? { 
              ...conv, 
              last_message_content: message.content,
              last_message_created_at: message.created_at,
              unread_count: message.sender === 'contact' ? conv.unread_count + 1 : conv.unread_count
            }
          : conv
      ));
    },
    onMessageStatusUpdate: (messageId, status) => {
      // Atualizar status da mensagem
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: status as any }
          : msg
      ));
    },
    onConversationUpdate: (conversation) => {
      // Atualizar conversa
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, ...conversation }
          : conv
      ));
    }
  });

  // Hook para notificações globais
  const { unreadCount, markAsRead, testNotification } = useGlobalNotifications({
    userId: user?.id,
    onNewMessage: (message, conversation) => {
      // Atualizar lista de conversas
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.id === conversation.id);
        if (existingIndex >= 0) {
          // Atualizar conversa existente
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            last_message_content: message.content,
            last_message_created_at: message.created_at,
            unread_count: updated[existingIndex].unread_count + 1
          };
          // Mover para o topo
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // Adicionar nova conversa
          return [conversation, ...prev];
        }
      });

      // Se a conversa está selecionada, adicionar mensagem
      if (selectedConversation?.id === conversation.id) {
        setMessages(prev => [...prev, message]);
        // Marcar como lida se a conversa está aberta
        markAsRead(conversation.id);
      }
    },
    onNewConversation: (conversation) => {
      // Adicionar nova conversa à lista com campos padrão
      const newConversation = {
        ...conversation,
        attendance_type: conversation.attendance_type || 'ai',
        attendance_status: conversation.attendance_status || 'pending',
        unread_count: conversation.unread_count || 0,
        has_attachments: conversation.has_attachments || false,
        is_archived: conversation.is_archived || false,
        is_favorite: conversation.is_favorite || false,
      };
      setConversations(prev => [newConversation, ...prev]);
    }
  });

  // Hook para buscar avatar do contato selecionado
  const contactAvatar = useContactAvatar(selectedConversation?.contacts?.phone || '');

  // Buscar avatar quando uma conversa for selecionada
  useEffect(() => {
    if (selectedConversation?.contacts?.phone) {
      contactAvatar.fetchAvatar();
    }
  }, [selectedConversation?.contacts?.phone]);

  // Função helper para adicionar campos padrão
  const addDefaultFields = (conversations: any[]): Conversation[] => {
    return conversations.map(conv => ({
      ...conv,
      unread_count: conv.unread_count || 0,
      has_attachments: conv.has_attachments || false,
      is_archived: conv.is_archived || false,
      is_favorite: conv.is_favorite || false,
      // Adicionar campos de atendimento com valores padrão
      // Por padrão, novas conversas começam com IA
      attendance_type: conv.attendance_type || 'ai',
      attendance_status: conv.attendance_status || 'pending',
    }));
  };

  // Mock data
  const mockConversations: Conversation[] = addDefaultFields([
    {
      id: 'mock-1',
      contact_id: 'contact-1',
      last_message_content: 'Olá! Como posso ajudar?',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      contacts: {
        id: 'contact-1',
        name: 'João Silva',
        phone: '+55 11 9999-0001',
        created_at: new Date().toISOString()
      },
      unread_count: 2
    },
    {
      id: 'mock-2',
      contact_id: 'contact-2',
      last_message_content: 'Obrigado pelo contato!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      contacts: {
        id: 'contact-2',
        name: 'Maria Santos',
        phone: '+55 11 9999-0002',
        created_at: new Date().toISOString()
      },
      has_attachments: true,
      is_favorite: true
    },
    {
      id: 'mock-3',
      contact_id: 'contact-3',
      last_message_content: 'Vou verificar e retorno em breve.',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      contacts: {
        id: 'contact-3',
        name: 'Pedro Costa',
        phone: '+55 11 9999-0003',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-4',
      contact_id: 'contact-4',
      last_message_content: 'Tudo bem, obrigado!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      contacts: {
        id: 'contact-4',
        name: 'Ana Oliveira',
        phone: '+55 11 9999-0004',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-5',
      contact_id: 'contact-5',
      last_message_content: 'Entendi perfeitamente',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      contacts: {
        id: 'contact-5',
        name: 'Carlos Ferreira',
        phone: '+55 11 9999-0005',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-6',
      contact_id: 'contact-6',
      last_message_content: 'Vou verificar isso para você',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      contacts: {
        id: 'contact-6',
        name: 'Lucia Mendes',
        phone: '+55 11 9999-0006',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-7',
      contact_id: 'contact-7',
      last_message_content: 'Perfeito, combinado!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      contacts: {
        id: 'contact-7',
        name: 'Roberto Alves',
        phone: '+55 11 9999-0007',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-8',
      contact_id: 'contact-8',
      last_message_content: 'Muito obrigada pela ajuda',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      contacts: {
        id: 'contact-8',
        name: 'Fernanda Lima',
        phone: '+55 11 9999-0008',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-9',
      contact_id: 'contact-9',
      last_message_content: 'Vou te passar as informações',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      contacts: {
        id: 'contact-9',
        name: 'Marcos Souza',
        phone: '+55 11 9999-0009',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-10',
      contact_id: 'contact-10',
      last_message_content: 'Ótimo, até logo!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      contacts: {
        id: 'contact-10',
        name: 'Patricia Rocha',
        phone: '+55 11 9999-0010',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-11',
      contact_id: 'contact-11',
      last_message_content: 'Preciso de mais detalhes',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      contacts: {
        id: 'contact-11',
        name: 'Ricardo Gomes',
        phone: '+55 11 9999-0011',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-12',
      contact_id: 'contact-12',
      last_message_content: 'Vou analisar sua solicitação',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      contacts: {
        id: 'contact-12',
        name: 'Juliana Costa',
        phone: '+55 11 9999-0012',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-13',
      contact_id: 'contact-13',
      last_message_content: 'Tudo certo, pode contar comigo',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      contacts: {
        id: 'contact-13',
        name: 'Diego Santos',
        phone: '+55 11 9999-0013',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-14',
      contact_id: 'contact-14',
      last_message_content: 'Vou te retornar em breve',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      contacts: {
        id: 'contact-14',
        name: 'Camila Rodrigues',
        phone: '+55 11 9999-0014',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-15',
      contact_id: 'contact-15',
      last_message_content: 'Perfeito, entendi tudo',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      contacts: {
        id: 'contact-15',
        name: 'Gabriel Martins',
        phone: '+55 11 9999-0015',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-16',
      contact_id: 'contact-16',
      last_message_content: 'Obrigado pela paciência',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      contacts: {
        id: 'contact-16',
        name: 'Beatriz Silva',
        phone: '+55 11 9999-0016',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-17',
      contact_id: 'contact-17',
      last_message_content: 'Vou resolver isso para você',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
      contacts: {
        id: 'contact-17',
        name: 'Thiago Oliveira',
        phone: '+55 11 9999-0017',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-18',
      contact_id: 'contact-18',
      last_message_content: 'Excelente, vamos em frente!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      contacts: {
        id: 'contact-18',
        name: 'Larissa Ferreira',
        phone: '+55 11 9999-0018',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-19',
      contact_id: 'contact-19',
      last_message_content: 'Preciso confirmar alguns dados',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      contacts: {
        id: 'contact-19',
        name: 'André Pereira',
        phone: '+55 11 9999-0019',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'mock-20',
      contact_id: 'contact-20',
      last_message_content: 'Muito obrigado, até a próxima!',
      last_message_created_at: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
      contacts: {
        id: 'contact-20',
        name: 'Vanessa Almeida',
        phone: '+55 11 9999-0020',
        created_at: new Date().toISOString()
      }
    }
  ]);

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
    }
  ];

  // Função para marcar como lida (declarada antes dos useEffects)
  const handleMarkAsRead = async (conversationId: string) => {
    console.log('🔍 handleMarkAsRead chamado para:', conversationId);
    try {
      // Marcar como lida localmente
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
      console.log('✅ Contador zerado localmente');
      
      // Marcar como lida no hook
      markAsRead(conversationId);
      console.log('✅ Hook markAsRead chamado');
      
      // Enviar confirmação de leitura via API
      console.log('📤 Enviando requisição para API mark-read...');
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 Resposta da API mark-read:', response.status, response.statusText);

      if (response.ok) {
        toast.success('Marcado como lido');
      } else {
        console.error('Erro ao marcar como lido');
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listener para marcar conversa como lida quando notificação for clicada
  useEffect(() => {
    const handleMarkConversationAsRead = async (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log('🔔 Marcando conversa como lida via notificação:', conversationId);
      
      // Usar a função completa de marcar como lida
      await handleMarkAsRead(conversationId);
      
      // Selecionar a conversa se não estiver selecionada
      if (!selectedConversation || selectedConversation.id !== conversationId) {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    };

    window.addEventListener('markConversationAsRead', handleMarkConversationAsRead as EventListener);
    
    return () => {
      window.removeEventListener('markConversationAsRead', handleMarkConversationAsRead as EventListener);
    };
  }, [conversations, selectedConversation, handleMarkAsRead]);

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      console.log('🔄 Buscando conversas da API...');
      
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }
      
      const data = await response.json();
      console.log('✅ Dados da API recebidos:', data);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
      console.log('🔄 Usando dados mock como fallback...');
      toast.error('Erro ao carregar conversas');
      // Fallback para dados mock em caso de erro
      setConversations(mockConversations);
      console.log('✅ Dados mock carregados:', mockConversations.length, 'conversas');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      // Só buscar mensagens se for uma conversa diferente da atual
      const currentConversationId = messages.length > 0 ? messages[0]?.conversation_id : null;
      if (currentConversationId !== selectedConversation.id) {
        fetchMessages(selectedConversation.id);
      }
    }
  }, [selectedConversation]);

  // Selecionar conversa baseada no parâmetro da URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation && (!selectedConversation || selectedConversation.id !== conversationId)) {
        console.log('🔗 Selecionando conversa da URL:', conversationId);
        setSelectedConversation(conversation);
        
        // Marcar como lida se tiver mensagens não lidas
        if (conversation.unread_count > 0) {
          handleMarkAsRead(conversationId);
        }
      }
    }
  }, [searchParams, conversations, selectedConversation]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (messages.length > 0) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Buscar mensagens de uma conversa
  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error('Erro ao buscar mensagens');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
      // Fallback para dados mock em caso de erro
      if (conversationId === 'mock-1') {
        setMessages(mockMessages);
      } else {
        setMessages([]);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowConversationMenu(null);
    };
    
    if (showConversationMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showConversationMenu]);

  // Fechar pickers quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowEmojiPicker(false);
      setShowTemplateSuggestions(false);
    };
    
    if (showEmojiPicker || showTemplateSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showEmojiPicker, showTemplateSuggestions]);


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (name: string) => (name?.trim()[0] || '?').toUpperCase();

  const handleToggleFavorite = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, is_favorite: !conv.is_favorite }
        : conv
    ));
    toast.success('Favorito atualizado');
  };

  const handleToggleArchive = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, is_archived: !conv.is_archived }
        : conv
    ));
    toast.success('Conversa arquivada');
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      toast.success('Conversa excluída');
    }
  };

  const handleStartNewConversation = async (contact: Contact) => {
    // Verificar se já existe uma conversa com este contato
    const existingConversation = conversations.find(conv => conv.contact_id === contact.id);
    
    if (existingConversation) {
      setSelectedConversation(existingConversation);
      toast.success('Conversa existente selecionada');
    } else {
      try {
        // Criar nova conversa via API
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact_id: contact.id
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newConversation = data.conversation;
          
          setConversations(prev => [newConversation, ...prev]);
          setSelectedConversation(newConversation);
          toast.success('Nova conversa iniciada');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erro ao criar conversa');
        }
      } catch (error) {
        console.error('Erro ao criar conversa:', error);
        toast.error('Erro ao criar conversa');
      }
    }
  };

  // Funções para seleção múltipla
  const handleToggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSelectAllConversations = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map(conv => conv.id));
    }
  };

  const handleBulkArchive = () => {
    setConversations(prev => prev.map(conv => 
      selectedConversations.includes(conv.id)
        ? { ...conv, is_archived: true }
        : conv
    ));
    toast.success(`${selectedConversations.length} conversas arquivadas`);
    setSelectedConversations([]);
    setBulkActionMode(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Tem certeza que deseja excluir ${selectedConversations.length} conversas?`)) {
      setConversations(prev => prev.filter(conv => !selectedConversations.includes(conv.id)));
      if (selectedConversations.includes(selectedConversation?.id || '')) {
        setSelectedConversation(null);
      }
      toast.success(`${selectedConversations.length} conversas excluídas`);
      setSelectedConversations([]);
      setBulkActionMode(false);
    }
  };

  const handleBulkMarkAsRead = () => {
    setConversations(prev => prev.map(conv => 
      selectedConversations.includes(conv.id)
        ? { ...conv, unread_count: 0 }
        : conv
    ));
    toast.success(`${selectedConversations.length} conversas marcadas como lidas`);
    setSelectedConversations([]);
    setBulkActionMode(false);
  };

  const handleSendMedia = async (file: File) => {
    if (!selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    
    try {
      // Fazer upload da mídia
      const uploadResponse = await whatsappAPI.uploadMedia(file);
      
      if (!uploadResponse.success || !uploadResponse.mediaUrl) {
        throw new Error(uploadResponse.error || 'Erro no upload');
      }

      // Criar mensagem temporária
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConversation.id,
        sender: 'user',
        content: file.type.startsWith('image/') ? '[Imagem]' : '[Documento]',
        created_at: new Date().toISOString(),
        status: 'sent'
      };

      setMessages(prev => [...prev, tempMessage]);

      // Enviar mensagem via API do WhatsApp
      const response = await whatsappAPI.sendMessage({
        to: selectedConversation.contacts.phone,
        message: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        mediaUrl: uploadResponse.mediaUrl,
        filename: file.name
      });

      if (response.success && response.messageId) {
        // Atualizar mensagem com ID real
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: response.messageId!, status: 'sent' }
            : msg
        ));

        // Atualizar última mensagem da conversa
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                last_message_content: file.type.startsWith('image/') ? '[Imagem]' : '[Documento]',
                last_message_created_at: new Date().toISOString(),
                has_attachments: true
              }
            : conv
        ));

        toast.success('Mídia enviada com sucesso!');
        
        // Simular atualização de status
        if (response.messageId) {
          whatsappAPI.simulateMessageDelivery(response.messageId);
        }
      } else {
        // Falha no envio
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        ));
        toast.error(response.error || 'Erro ao enviar mídia');
      }
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
      toast.error('Erro ao enviar mídia');
    } finally {
      setSendingMessage(false);
      setShowMediaPicker(false);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Verificar se está digitando um comando /
    if (value.includes('/') && value.lastIndexOf('/') > value.lastIndexOf(' ')) {
      const command = value.substring(value.lastIndexOf('/') + 1).toLowerCase();
      
      if (command.length === 0) {
        // Mostrar todos os templates quando digitar apenas /
        setTemplateSuggestions(templatesFromDB);
        setShowTemplateSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        // Filtrar templates baseado no comando digitado
        const suggestions = templatesFromDB.filter(template =>
          template.shortcut.toLowerCase().startsWith(command) ||
          template.name.toLowerCase().includes(command)
        );
        setTemplateSuggestions(suggestions);
        setShowTemplateSuggestions(suggestions.length > 0);
        setSelectedSuggestionIndex(0);
      }
    } else {
      setShowTemplateSuggestions(false);
    }
  };

  const handleSelectSuggestion = (template: any) => {
    const lastSlashIndex = newMessage.lastIndexOf('/');
    const beforeSlash = newMessage.substring(0, lastSlashIndex);
    setNewMessage(beforeSlash + template.content);
    setShowTemplateSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showTemplateSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < templateSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : templateSuggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (templateSuggestions[selectedSuggestionIndex]) {
          handleSelectSuggestion(templateSuggestions[selectedSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowTemplateSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    
    // Criar mensagem temporária
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender: 'user',
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Enviar mensagem via API real
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          type: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mensagem enviada:', data);
        
        // Atualizar mensagem com dados reais
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { 
                ...msg, 
                id: data.message.id,
                status: 'sent' // Inicialmente como 'sent', será atualizado via webhook
              }
            : msg
        ));

        // Atualizar última mensagem da conversa
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                last_message_content: messageContent,
                last_message_created_at: new Date().toISOString()
              }
            : conv
        ));

        toast.success('Mensagem enviada com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao enviar mensagem:', errorData);
        // Falha no envio
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        ));
        toast.error(errorData.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };


  return (
    <div className="full-bleed-chat bg-white">
      {/* Sidebar - Lista de Conversas */}
      <div className="w-[500px] border-r border-gray-200 bg-white flex flex-col">
        {/* Header da sidebar */}
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
              {unreadCount > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowNewConversationModal(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                title="Nova conversa"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button 
                onClick={() => fetchConversations()}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setBulkActionMode(!bulkActionMode)}
                className={`p-2 rounded-full transition-colors ${
                  bulkActionMode 
                    ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                title="Ações em lote"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Abas */}
          <div className="px-4">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('ai_active')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'ai_active'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                1. Falando com a IA
              </button>
              <button
                onClick={() => setActiveTab('human')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'human'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                2. Atendimento Humano
              </button>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar ou começar uma nova conversa"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros por aba */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          {activeTab === 'ai_active' ? (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setAiFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  aiFilter === 'all'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setAiFilter('pending')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  aiFilter === 'pending'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pendentes
              </button>
              <button 
                onClick={() => setAiFilter('completed')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  aiFilter === 'completed'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Concluídas
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setHumanFilter('unanswered')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  humanFilter === 'unanswered'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Não respondidas
              </button>
              <button 
                onClick={() => setHumanFilter('in_progress')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  humanFilter === 'in_progress'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Em Andamento
              </button>
              <button 
                onClick={() => setHumanFilter('completed')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  humanFilter === 'completed'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Finalizadas
              </button>
            </div>
          )}
        </div>

        {/* Barra de ações em lote */}
        {bulkActionMode && (
          <div className="flex-shrink-0 p-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllConversations}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedConversations.length === filteredConversations.length ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
                <span className="text-sm text-blue-600">
                  {selectedConversations.length} selecionadas
                </span>
              </div>
              
              {selectedConversations.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Marcar como lido
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Arquivar
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loadingConversations ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              {searchTerm ? 'Nenhuma conversa encontrada' : ''}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                    selectedConversation?.id === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                  } ${selectedConversations.includes(conversation.id) ? 'bg-blue-50' : ''}`}
                >
                  <div onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (bulkActionMode) {
                      handleToggleConversationSelection(conversation.id);
                    } else {
                      setSelectedConversation(conversation);
                      // Marcar como lida se tiver mensagens não lidas
                      if (conversation.unread_count > 0) {
                        handleMarkAsRead(conversation.id);
                      }
                    }
                  }}>
                    <div className="flex items-center space-x-3">
                    {bulkActionMode && (
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conversation.id)}
                        onChange={() => handleToggleConversationSelection(conversation.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700">
                          {getInitial(conversation.contacts.name)}
                        </span>
                      </div>
                      {conversation.is_favorite && (
                        <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <h3 className="text-base font-[400px] text-gray-900 truncate" style={{ fontSize: '16px' }}>
                            {conversation.contacts.name}
                          </h3>
                          {conversation.has_attachments && (
                            <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {conversation.unread_count > 0 && (
                            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {conversation.unread_count}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message_content || 'Nenhuma mensagem'}
                      </p>
                    </div>
                  </div>
                  </div>
                  
                  {/* Menu de ações */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConversationMenu(showConversationMenu === conversation.id ? null : conversation.id);
                    }}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Dropdown menu */}
                  {showConversationMenu === conversation.id && (
                    <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={() => {
                          handleToggleFavorite(conversation.id);
                          setShowConversationMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Star className={`w-4 h-4 ${conversation.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        <span>{conversation.is_favorite ? 'Remover favorito' : 'Adicionar favorito'}</span>
                      </button>
                      
                      {conversation.unread_count > 0 && (
                        <button
                          onClick={() => {
                            handleMarkAsRead(conversation.id);
                            setShowConversationMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4 text-gray-400" />
                          <span>Marcar como lido</span>
                        </button>
                      )}

                      {/* Botão de transferir para humano - apenas para conversas de IA */}
                      {activeTab === 'ai_active' && conversation.attendance_type === 'ai' && (
                        <button
                          onClick={() => {
                            transferToHuman(conversation.id);
                            setShowConversationMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-green-600"
                        >
                          <User className="w-4 h-4" />
                          <span>Transferir para humano</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          handleToggleArchive(conversation.id);
                          setShowConversationMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Archive className="w-4 h-4 text-gray-400" />
                        <span>{conversation.is_archived ? 'Desarquivar' : 'Arquivar'}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleDeleteConversation(conversation.id);
                          setShowConversationMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da conversa */}
            <div className="flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {contactAvatar.avatarUrl ? (
                    <img 
                      src={contactAvatar.avatarUrl} 
                      alt={selectedConversation.contacts.name}
                      className="w-full h-full object-cover"
                      onError={() => contactAvatar.refetch()}
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {getInitial(selectedConversation.contacts.name)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>
                    {selectedConversation.contacts.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.contacts.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                  <Search className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="messages-container flex-1 overflow-y-auto px-4 py-2 relative"
              style={{
                backgroundColor: '#F5F1EB',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='zap-pattern' patternUnits='userSpaceOnUse' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F1EB'/%3E%3Cg fill='%23D4C4B0' opacity='0.6'%3E%3Cpath d='M10 8L16 14L10 20L16 14L22 8L16 14L22 20L16 14L22 8L16 14L10 8Z'/%3E%3Cpath d='M30 24L36 30L30 36L36 30L42 24L36 30L42 36L36 30L42 24L36 30L30 24Z'/%3E%3Cpath d='M2 26L8 32L2 38L8 32L14 26L8 32L14 38L8 32L14 26L8 32L2 26Z'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23zap-pattern)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}
            >
              <div className="relative z-10 pb-4">
                {loadingMessages ? (
                  <div className="text-center text-gray-500 py-8">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">Nenhuma mensagem ainda</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-0.5`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-[#dcf8c6] text-gray-900 ml-12'
                            : 'bg-white text-gray-900 mr-12'
                        }`}
                      >
                        <p className="text-sm" style={{ fontSize: '14.2px' }}>{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          message.sender === 'user' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.created_at)}
                          </span>
                          {message.sender === 'user' && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                              {message.status === 'delivered' && <CheckCheck className="w-3 h-3 text-gray-400" />}
                              {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                              {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Input */}
            <div 
              className="flex-shrink-0 px-4 py-3 border-t border-gray-200"
              style={{ backgroundColor: '#F5F1EB' }}
            >
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Emojis"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  id="media-input"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSendMedia(file);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="media-input"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <Paperclip className="h-5 w-5" />
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:border-gray-300 text-sm"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500">Escolha uma conversa da lista para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Nova Conversa */}
      <NewConversationModalEnhanced
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onStartConversation={handleStartNewConversation}
      />

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Template Suggestions */}
      {showTemplateSuggestions && (
        <TemplateSuggestions
          suggestions={templateSuggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={handleSelectSuggestion}
          onClose={() => setShowTemplateSuggestions(false)}
        />
      )}

      
    </div>
  );
}
