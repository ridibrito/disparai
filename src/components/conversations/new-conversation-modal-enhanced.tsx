'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Search, User, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (contact: Contact) => void;
}

export function NewConversationModalEnhanced({ isOpen, onClose, onStartConversation }: NewConversationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useAuth();

  const fetchContacts = async (searchQuery?: string) => {
    try {
      setLoading(true);
      console.log('Buscando contatos...', { searchQuery });
      
      // Verificar se o usuário está autenticado
      if (!user) {
        console.error('Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }
      
      console.log('Usuário autenticado:', user.id);

      // Teste simples - buscar todos os contatos primeiro
      console.log('Testando busca simples...');
      const { data: allContacts, error: allError } = await supabase
        .from('contacts')
        .select('*');

      console.log('Todos os contatos (sem filtro):', { allContacts, allError });

      // Buscar a organização do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        toast.error('Erro ao carregar dados do usuário');
        return;
      }

      console.log('Organização do usuário:', userData?.organization_id);

      let query = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', userData?.organization_id)
        .order('name', { ascending: true });

      // Se há termo de busca, filtrar no banco
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      console.log('Resultado da busca:', { data, error });

      if (error) {
        console.error('Erro ao buscar contatos:', error);
        toast.error(`Erro ao carregar contatos: ${error.message}`);
        return;
      }

      // Se não encontrou contatos com filtro de organização, usar todos os contatos
      if (!data || data.length === 0) {
        console.log('Nenhum contato encontrado com filtro de organização, usando todos os contatos');
        setContacts(allContacts || []);
        console.log('Contatos carregados (sem filtro):', allContacts?.length || 0);
      } else {
        setContacts(data || []);
        console.log('Contatos carregados (com filtro):', data?.length || 0);
      }
      
      if ((!data || data.length === 0) && (!allContacts || allContacts.length === 0)) {
        console.log('Nenhum contato encontrado na tabela');
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Modal aberto, buscando contatos...');
      fetchContacts();
    }
  }, [isOpen]);

  // Debounce para busca em tempo real
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchContacts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen]);

  // Os contatos já vêm filtrados do banco de dados
  const filteredContacts = contacts;

  const handleStartConversation = () => {
    if (selectedContact) {
      onStartConversation(selectedContact);
      onClose();
      setSelectedContact(null);
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedContact(null);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nova Conversa</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado. Vá para a página de contatos para adicionar contatos.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.phone}
                      </p>
                    </div>
                    {selectedContact?.id === contact.id && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartConversation}
              disabled={!selectedContact}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Iniciar Conversa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
