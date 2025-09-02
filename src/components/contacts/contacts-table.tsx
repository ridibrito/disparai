'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteContactDialog } from './delete-contact-dialog';
import { Edit, Trash2, Search, Filter, Download, ListPlus, ChevronDown } from 'lucide-react';
import { Database } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

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
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [allowedIdsByList, setAllowedIdsByList] = useState<Set<string> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  // Auto refresh quando novo contato for salvo
  useEffect(() => {
    const onRefresh = () => router.refresh();
    document.addEventListener('contacts:refresh' as any, onRefresh);
    return () => document.removeEventListener('contacts:refresh' as any, onRefresh);
  }, [router]);
  
  // Seleção por checkbox
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAllOnPage = () => {
    const pageIds = pagedContacts.map((c) => c.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };
  const clearSelection = () => setSelectedIds([]);

  // Listas
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [targetListId, setTargetListId] = useState<string>('');
  const [newListName, setNewListName] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);
  const [pageContactLists, setPageContactLists] = useState<Record<string, string[]>>({});
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const { data, error } = await supabase
          .from('contact_lists')
          .select('id, name')
          .eq('organization_id', userId);
        if (error) throw error;
        setLists(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar listas:', err);
      }
    };
    loadLists();
    const onListsRefresh = () => loadLists();
    document.addEventListener('lists:refresh' as any, onListsRefresh);
    return () => document.removeEventListener('lists:refresh' as any, onListsRefresh);
  }, [supabase, userId]);

  // Carregar ids de contatos pertencentes à lista selecionada
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedListId) {
        setAllowedIdsByList(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('contact_list_members')
          .select('contact_id')
          .eq('list_id', selectedListId);
        if (error) throw error;
        setAllowedIdsByList(new Set((data || []).map((r: any) => r.contact_id)));
      } catch (err) {
        console.error('Erro ao buscar membros da lista:', err);
      }
    };
    fetchMembers();
  }, [selectedListId, supabase]);

  // Filtrar contatos com base na pesquisa e lista selecionada
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesList = !allowedIdsByList || allowedIdsByList.has(contact.id);
    return matchesSearch && matchesList;
  });
  const total = filteredContacts.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pagedContacts = filteredContacts.slice(startIndex, endIndex);

  // Duplicados por telefone (normalizando dígitos)
  const normalizePhone = (p: string) => (p || '').replace(/\D/g, '');
  const phoneCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach((c) => {
      const key = normalizePhone(c.phone);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [contacts]);
  const isDuplicatePhone = (phone: string) => (phoneCountMap.get(normalizePhone(phone)) || 0) > 1;

  const canMergeSelected = React.useMemo(() => {
    if (selectedIds.length < 2) return false;
    const selected = contacts.filter((c) => selectedIds.includes(c.id));
    if (selected.length < 2) return false;
    const first = normalizePhone(selected[0].phone);
    return selected.every((c) => normalizePhone(c.phone) === first);
  }, [selectedIds, contacts]);

  async function handleMergeSelected() {
    if (!canMergeSelected) {
      toast.error('Selecione pelo menos 2 contatos com o mesmo telefone.');
      return;
    }
    try {
      setIsMerging(true);
      // Buscar dados atualizados dos selecionados
      const { data: rows, error } = await supabase
        .from('contacts')
        .select('id, name, custom_fields, created_at')
        .in('id', selectedIds as any);
      if (error) throw error;
      const selected = (rows || []) as any[];
      if (selected.length < 2) throw new Error('Seleção insuficiente.');
      // Escolher principal: mais recente
      selected.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const primary = selected[0];
      const secondary = selected.slice(1);
      // Merge simples: nome e custom_fields
      let mergedName = primary.name;
      if (!mergedName) {
        const alt = secondary.find((s) => s.name && s.name.trim().length > 0);
        if (alt) mergedName = alt.name;
      }
      const mergedFields: Record<string, any> = { ...(primary.custom_fields || {}) };
      for (const s of secondary) {
        const cf = s.custom_fields || {};
        for (const [k, v] of Object.entries(cf)) {
          if (mergedFields[k] == null || mergedFields[k] === '') mergedFields[k] = v;
        }
      }
      // Mover membresias de listas para o principal
      const { data: members, error: memErr } = await supabase
        .from('contact_list_members')
        .select('contact_id, list_id')
        .in('contact_id', secondary.map((s) => s.id));
      if (memErr) throw memErr;
      if (members && members.length > 0) {
        const rowsToUpsert = members.map((m) => ({ contact_id: primary.id, list_id: (m as any).list_id }));
        const { error: upErr } = await supabase
          .from('contact_list_members')
          .upsert(rowsToUpsert as any, { onConflict: 'contact_id,list_id', ignoreDuplicates: true } as any);
        if (upErr) throw upErr;
      }
      // Atualizar contato principal
      const { error: upContactErr } = await supabase
        .from('contacts')
        .update({ name: mergedName || null, custom_fields: mergedFields } as any)
        .eq('id', primary.id);
      if (upContactErr) throw upContactErr;
      // Apagar secundários
      const { error: delErr } = await supabase
        .from('contacts')
        .delete()
        .in('id', secondary.map((s) => s.id));
      if (delErr) throw delErr;
      toast.success('Contatos mesclados com sucesso.');
      setSelectedIds([]);
      router.refresh();
      try { document.dispatchEvent(new CustomEvent('contacts:refresh')); } catch {}
    } catch (err: any) {
      console.error('Erro ao mesclar contatos:', err);
      toast.error(err.message || 'Erro ao mesclar contatos');
    } finally {
      setIsMerging(false);
    }
  }

  // Carregar listas por contato (apenas para a página atual)
  useEffect(() => {
    const loadPageContactLists = async () => {
      const ids = pagedContacts.map((c) => c.id);
      if (ids.length === 0) {
        setPageContactLists({});
        return;
      }
      try {
        const { data, error } = await supabase
          .from('contact_list_members')
          .select('contact_id, list_id')
          .in('contact_id', ids);
        if (error) throw error;
        const idToNames: Record<string, string[]> = {};
        const listNameById = new Map(lists.map((l) => [l.id, l.name]));
        (data || []).forEach((row: any) => {
          const listName = listNameById.get(row.list_id);
          if (!listName) return;
          if (!idToNames[row.contact_id]) idToNames[row.contact_id] = [];
          idToNames[row.contact_id].push(listName);
        });
        setPageContactLists(idToNames);
      } catch (err) {
        console.error('Erro ao carregar listas por contato:', err);
      }
    };
    loadPageContactLists();
  }, [pagedContacts, lists, supabase]);

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

  async function handleMoveToList() {
    if (selectedIds.length === 0) return;
    try {
      setIsMoving(true);
      const orgId = await ensureOrganization();
      let listId = targetListId;
      if (listId === 'new') {
        if (!newListName.trim()) {
          toast.error('Informe o nome da nova lista');
          setIsMoving(false);
          return;
        }
        const { data: created, error: createErr } = await supabase
          .from('contact_lists')
          .insert({ user_id: userId, organization_id: orgId, name: newListName.trim() } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        listId = (created as any).id as string;
        setLists((prev) => [...prev, { id: listId!, name: newListName.trim() }]);
        setTargetListId(listId!);
      }
      if (!listId) {
        toast.error('Selecione uma lista ou crie uma nova.');
        setIsMoving(false);
        return;
      }
      const members = selectedIds.map((contactId) => ({ contact_id: contactId, list_id: listId }));
      const { error: upErr } = await supabase
        .from('contact_list_members')
        .upsert(members as any, { onConflict: 'contact_id,list_id', ignoreDuplicates: true } as any);
      if (upErr) throw upErr;
      toast.success(`Movidos ${selectedIds.length} contato(s) para a lista.`);
      clearSelection();
      setNewListName('');
      router.refresh();
      try { document.dispatchEvent(new CustomEvent('lists:refresh')); } catch {}
    } catch (err: any) {
      console.error('Erro ao mover para lista:', err);
      toast.error(err.message || 'Erro ao mover para lista');
    } finally {
      setIsMoving(false);
    }
  }

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
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Todas as listas</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          
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
      
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-md border bg-[var(--color-surface)]">
          <div className="text-sm">
            {selectedIds.length} selecionado(s)
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={targetListId}
              onChange={(e) => setTargetListId(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="">Selecionar lista</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
              <option value="new">+ Criar nova lista…</option>
            </select>
            {targetListId === 'new' && (
              <Input
                placeholder="Nome da nova lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="h-10"
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearSelection}>Cancelar</Button>
              <Button onClick={handleMoveToList} disabled={isMoving}>
                <ListPlus className="h-4 w-4 mr-2" />
                {isMoving ? 'Movendo...' : 'Mover para lista'}
              </Button>
              <Button onClick={handleMergeSelected} disabled={!canMergeSelected || isMerging}>
                {isMerging ? 'Mesclando...' : 'Mesclar selecionados'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredContacts.length > 0 ? (
        <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    onChange={toggleAllOnPage}
                    checked={pagedContacts.every((c) => selectedIds.includes(c.id)) && pagedContacts.length > 0}
                  />
                </th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Nome</th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Telefone</th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Email</th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Lista(s)</th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Adicionado em</th>
                <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected(contact.id)}
                      onChange={() => toggleOne(contact.id)}
                    />
                  </td>
                  <td className="py-3 px-4">{contact.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{contact.phone}</span>
                      {isDuplicatePhone(contact.phone) && (
                        <span className="text-[10px] uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Duplicado</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{contact.email || '-'}</td>
                  <td className="py-3 px-4">{pageContactLists[contact.id]?.join(', ') || '-'}</td>
                  <td className="py-3 px-4">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-start">
                      <Link href={`/contatos/editar/${contact.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-transparent"
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Mostrando <strong>{total === 0 ? 0 : startIndex + 1}</strong>–<strong>{endIndex}</strong> de <strong>{total}</strong>
          </p>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
            >
              {[10, 20, 50].map(s => (
                <option key={s} value={s}>{s}/página</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={endIndex >= total}
                onClick={() => setPage((p) => (endIndex >= total ? p : p + 1))}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">
            {searchTerm || selectedListId 
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