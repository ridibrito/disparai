'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: any) => void;
}

export function NewConversationModal({ 
  isOpen, 
  onClose, 
  onConversationCreated 
}: NewConversationModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm)
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts || []);
        setFilteredContacts(data.contacts || []);
      } else {
        console.error('Error fetching contacts:', data.error);
        toast.error('Erro ao carregar contatos');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
    }
    setLoading(false);
  };

  const handleCreateConversation = async (contact: Contact) => {
    setCreating(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact_id: contact.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Conversa criada com sucesso!');
        onConversationCreated(data.conversation);
        onClose();
        setSearchTerm('');
      } else {
        console.error('Error creating conversation:', data.error);
        toast.error(data.error || 'Erro ao criar conversa');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erro ao criar conversa');
    }
    setCreating(false);
  };

  const getInitial = (name: string) => (name?.trim()[0] || '?').toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Selecione um contato para iniciar uma nova conversa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de contatos */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Carregando contatos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCreateConversation(contact)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitial(contact.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={creating}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateConversation(contact);
                    }}
                  >
                    {creating ? 'Criando...' : 'Conversar'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
