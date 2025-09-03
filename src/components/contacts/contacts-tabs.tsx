'use client';

import React from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { ContactsTable } from '@/components/contacts/contacts-table';
import { ContactImportForm } from '@/components/contacts/contact-import-form';
import { NewContactButton } from '@/components/contacts/new-contact-button';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import type { Database } from '@/lib/supabase';

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  email?: string | null;
  group?: string | null;
};

type List = {
  id: string;
  name: string;
  created_at: string;
};

interface ContactsTabsProps {
  userId: string;
  contacts: Contact[];
  lists: List[];
  remainingContacts: number;
}

export function ContactsTabs({ userId, contacts, lists, remainingContacts }: ContactsTabsProps) {
  const [active, setActive] = React.useState<'contacts' | 'lists'>('contacts');
  const [listsState, setListsState] = React.useState<(List & { contacts_count?: number })[]>(lists);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isMovingOpen, setIsMovingOpen] = React.useState<null | { fromListId: string; fromListName: string }>(null);
  const [moveTargetListId, setMoveTargetListId] = React.useState('');
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<null | { listId: string; listName: string }>(null);
  const supabase = createClientComponentClient();

  React.useEffect(() => {
    setListsState(lists);
  }, [lists]);

  const ensureOrganization = async (): Promise<string> => {
    const { data: org } = await supabase
      .from('organizations' as any)
      .select('id')
      .eq('id', userId as any)
      .maybeSingle();
    if ((org as any)?.id) return (org as any).id as string;
    const { data: inserted } = await supabase
      .from('organizations' as any)
      .insert({ id: userId as any, owner_id: userId as any, name: 'Conta' } as any)
      .select('id')
      .single();
    return (inserted as any).id as string;
  };

  const handleCreateList = async () => {
    try {
      if (!newListName.trim()) {
        toast.error('Informe o nome da lista');
        return;
      }
      setIsCreating(true);
      const orgId = await ensureOrganization();
      const { data, error } = await supabase
        .from('contact_lists' as any)
        .insert({ user_id: userId, organization_id: orgId, name: newListName.trim() } as any)
        .select('id, name, created_at')
        .single();
      if (error) throw error;
      setListsState((prev) => [data as any, ...prev]);
      setIsCreateOpen(false);
      setNewListName('');
      toast.custom((t) => (
        <div className="bg-green-600 text-white px-4 py-2 rounded shadow">
          Lista criada
        </div>
      ));
      try {
        document.dispatchEvent(new CustomEvent('lists:refresh'));
      } catch {}
    } catch (err: any) {
      console.error('Erro ao criar lista:', err);
      toast.error(err.message || 'Erro ao criar lista');
    } finally {
      setIsCreating(false);
    }
  };

  // Atualiza contagem real de contatos por lista
  const refreshCounts = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_list_members' as any)
        .select('list_id');
      if (error) throw error;
      const counts = new Map<string, number>();
      (data as any[] | null)?.forEach((r: any) => counts.set(r.list_id, (counts.get(r.list_id) || 0) + 1));
      setListsState((prev) => prev.map((l) => ({ ...l, contacts_count: counts.get(l.id) || 0 })));
    } catch (err) {
      console.error('Erro ao contar membros por lista:', err);
    }
  }, [supabase]);

  React.useEffect(() => {
    refreshCounts();
    const onListsRefresh = () => refreshCounts();
    document.addEventListener('lists:refresh' as any, onListsRefresh);
    return () => document.removeEventListener('lists:refresh' as any, onListsRefresh);
  }, [refreshCounts, listsState.length, active]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-6 pt-4">
        <div className="flex gap-6">
          <button
            className={
              active === 'contacts'
                ? 'py-3 border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                : 'py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
            }
            onClick={() => setActive('contacts')}
          >
            Contatos
          </button>
          <button
            className={
              active === 'lists'
                ? 'py-3 border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                : 'py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
            }
            onClick={() => setActive('lists')}
          >
            Listas
          </button>
        </div>
      </div>

      <div className="p-6">
        {active === 'contacts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Lista de Contatos</h2>
              <div className="flex items-center gap-2">
                <ContactImportForm userId={userId} remainingContacts={remainingContacts} compact />
                <NewContactButton userId={userId} />
              </div>
            </div>
            <ContactsTable initialContacts={contacts as any} userId={userId} />
          </div>
        )}

        {active === 'lists' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Listas</h2>
              <Button className="bg-[var(--color-primary)] text-white" onClick={() => setIsCreateOpen(true)}>Criar lista</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                    <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Nome</th>
                    <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Contatos</th>
                    <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Criada em</th>
                    <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(listsState || []).map((l) => (
                    <tr key={l.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="py-3 px-4">{l.name}</td>
                      <td className="py-3 px-4">{l.contacts_count ?? 0}</td>
                      <td className="py-3 px-4">{new Date(l.created_at as any).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <button
                            className="h-8 w-8 rounded hover:bg-gray-100 inline-flex items-center justify-center"
                            onClick={() => setOpenMenuId((prev) => (prev === l.id ? null : l.id))}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === l.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-[var(--color-border)] rounded-md shadow z-10">
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  try {
                                    // Checagem em tempo real da contagem para evitar apagar lista com contatos
                                    const { count, error } = await (supabase as any)
                                      .from('contact_list_members')
                                      .select('contact_id', { count: 'exact', head: true })
                                      .eq('list_id', l.id);
                                    if (error) throw error;
                                    if ((count ?? 0) > 0) {
                                      setIsMovingOpen({ fromListId: l.id, fromListName: l.name });
                                      toast((count ?? 0) + ' contato(s) encontrados. Mova antes de apagar.');
                                      return;
                                    }
                                  } catch {}
                                  setIsDeleteOpen({ listId: l.id, listName: l.name });
                                }}
                              >
                                Apagar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!listsState || listsState.length === 0) && (
                    <tr>
                      <td className="py-6 px-4 text-gray-500" colSpan={4}>Nenhuma lista criada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {isMovingOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
                  <h3 className="text-lg font-semibold mb-3">Mover contatos de "{isMovingOpen.fromListName}"</h3>
                  <select
                    value={moveTargetListId}
                    onChange={(e) => setMoveTargetListId(e.target.value)}
                    className="w-full h-11 rounded-md border border-[var(--color-border)] px-3 mb-4"
                  >
                    <option value="">Selecione a lista destino</option>
                    {listsState.filter((x) => x.id !== isMovingOpen.fromListId).map((x) => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsMovingOpen(null); setMoveTargetListId(''); }}>Cancelar</Button>
                    <Button onClick={async () => {
                      try {
                        if (!moveTargetListId) { toast.error('Selecione a lista destino'); return; }
                        const { data: members, error: memErr } = await supabase
                          .from('contact_list_members')
                          .select('contact_id')
                          .eq('list_id', isMovingOpen!.fromListId);
                        if (memErr) throw memErr;
                        const contactIds = (members || []).map((m: any) => m.contact_id);
                        if (contactIds.length > 0) {
                          const rows = contactIds.map((cid: string) => ({ contact_id: cid, list_id: moveTargetListId }));
                          const { error: upErr } = await supabase
                            .from('contact_list_members')
                            .upsert(rows as any, { onConflict: 'contact_id,list_id', ignoreDuplicates: true } as any);
                          if (upErr) throw upErr;
                          const { error: delErr } = await supabase
                            .from('contact_list_members')
                            .delete()
                            .eq('list_id', isMovingOpen!.fromListId);
                          if (delErr) throw delErr;
                        }
                        const { error: delListErr } = await supabase.from('contact_lists').delete().eq('id', isMovingOpen!.fromListId);
                        if (delListErr) throw delListErr;
                        setListsState((prev) => prev.filter((l) => l.id !== isMovingOpen!.fromListId));
                        setIsMovingOpen(null);
                        setMoveTargetListId('');
                        toast.custom((t) => (
                          <div className="bg-red-600 text-white px-4 py-2 rounded shadow">
                            Contatos movidos e lista apagada
                          </div>
                        ));
                        document.dispatchEvent(new CustomEvent('lists:refresh'));
                      } catch (err: any) {
                        toast.error(err.message || 'Erro ao mover e apagar lista');
                      }
                    }} disabled={!moveTargetListId}>Mover e apagar</Button>
                  </div>
                </div>
              </div>
            )}

            {isDeleteOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
                  <h3 className="text-lg font-semibold mb-3">Apagar lista</h3>
                  <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja apagar a lista "{isDeleteOpen.listName}"?</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => setIsDeleteOpen(null)}>Cancelar</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
                      try {
                        const { error } = await supabase.from('contact_lists').delete().eq('id', isDeleteOpen.listId);
                        if (error) throw error;
                        setListsState((prev) => prev.filter((x) => x.id !== isDeleteOpen.listId));
                        setIsDeleteOpen(null);
                        toast.custom((t) => (
                          <div className="bg-red-600 text-white px-4 py-2 rounded shadow">
                            Lista apagada
                          </div>
                        ));
                        document.dispatchEvent(new CustomEvent('lists:refresh'));
                      } catch (err: any) {
                        toast.error(err.message || 'Erro ao apagar lista');
                      }
                    }}>Apagar</Button>
                  </div>
                </div>
              </div>
            )}

            {isCreateOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
                  <h3 className="text-lg font-semibold mb-3">Criar nova lista</h3>
                  <input
                    className="w-full h-11 rounded-md border border-[var(--color-border)] px-3 mb-4"
                    placeholder="Nome da lista"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsCreateOpen(false); setNewListName(''); }}>Cancelar</Button>
                    <Button onClick={handleCreateList} disabled={isCreating}>
                      {isCreating ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


