'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteContactDialog } from './delete-contact-dialog';
import { Edit, Trash2, Search, Filter, Download } from 'lucide-react';
import { Database } from '@/lib/supabase';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  group?: string;
  created_at: string;
};

type ContactsTableProps = {
  initialContacts: Contact[];
  userId: string;
};

export function ContactsTable({ initialContacts, userId }: ContactsTableProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Extrair grupos únicos dos contatos
  const uniqueGroups = Array.from(new Set(contacts.map(contact => contact.group).filter(Boolean)));
  
  // Filtrar contatos com base na pesquisa e grupo selecionado
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGroup = selectedGroup === '' || contact.group === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });
  
  // Função para abrir o diálogo de exclusão
  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete({ id: contact.id, name: contact.name });
    setIsDeleteDialogOpen(true);
  };
  
  // Função para fechar o diálogo de exclusão
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setContactToDelete(null);
  };
  
  // Função chamada após a exclusão bem-sucedida
  const handleContactDeleted = () => {
    if (contactToDelete) {
      setContacts(contacts.filter(contact => contact.id !== contactToDelete.id));
    }
    router.refresh();
  };
  
  // Função para exportar contatos como CSV
  const exportContacts = () => {
    // Preparar os dados para exportação
    const csvData = filteredContacts.map(contact => {
      return {
        Nome: contact.name,
        Telefone: contact.phone,
        Email: contact.email || '',
        Grupo: contact.group || '',
        'Data de Cadastro': new Date(contact.created_at).toLocaleDateString('pt-BR')
      };
    });
    
    // Converter para CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');
    
    // Criar um blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos os grupos</option>
            {uniqueGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportContacts}
            disabled={filteredContacts.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      {filteredContacts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-2 px-4 text-left font-medium">Nome</th>
                <th className="py-2 px-4 text-left font-medium">Telefone</th>
                <th className="py-2 px-4 text-left font-medium">Email</th>
                <th className="py-2 px-4 text-left font-medium">Grupo</th>
                <th className="py-2 px-4 text-left font-medium">Adicionado em</th>
                <th className="py-2 px-4 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{contact.name}</td>
                  <td className="py-3 px-4">{contact.phone}</td>
                  <td className="py-3 px-4">{contact.email || '-'}</td>
                  <td className="py-3 px-4">{contact.group || '-'}</td>
                  <td className="py-3 px-4">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/contacts/edit/${contact.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteDialog(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">
            {searchTerm || selectedGroup 
              ? 'Nenhum contato encontrado com os filtros aplicados.'
              : 'Nenhum contato cadastrado.'}
          </p>
        </div>
      )}
      
      {contactToDelete && (
        <DeleteContactDialog
          contactId={contactToDelete.id}
          contactName={contactToDelete.name}
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onDeleted={handleContactDeleted}
        />
      )}
    </div>
  );
}