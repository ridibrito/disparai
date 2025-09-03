"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ContactForm } from './contact-form';
import { createClientComponentClient } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EditContactModalProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  contactId: string;
  initialData?: {
    name?: string | null;
    phone?: string;
  };
};

export function EditContactModal({ open, onClose, userId, contactId, initialData }: EditContactModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState<string>('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  // Carregar listas do usuário e a lista atual do contato
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const { data: ls } = await supabase
          .from('contact_lists' as any)
          .select('id, name')
          .eq('user_id', userId as any)
          .order('name', { ascending: true });
        setLists((ls as any) || []);
        // Buscar a lista atual (se houver)
        const { data: mem } = await supabase
          .from('contact_list_members' as any)
          .select('list_id')
          .eq('contact_id', contactId as any)
          .limit(1);
        if (mem && (mem as any).length > 0) setSelectedListId((mem as any)[0].list_id as string);
        else setSelectedListId('');
      } catch {}
    };
    load();
  }, [open, supabase, userId, contactId]);

  const applyListChange = async () => {
    try {
      let finalListId = selectedListId;
      if (selectedListId === '__create__') {
        const { data: created, error: createErr } = await supabase
          .from('contact_lists' as any)
          .insert({ user_id: userId as any, organization_id: userId as any, name: (newListName || '').trim() } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        finalListId = (created as any)?.id || '';
      }

      // Remover membresias antigas
      await supabase.from('contact_list_members' as any).delete().eq('contact_id', contactId as any);
      // Inserir nova, se houver
      if (finalListId) {
        await supabase
          .from('contact_list_members' as any)
          .upsert({ contact_id: contactId as any, list_id: finalListId as any } as any, { onConflict: 'contact_id,list_id', ignoreDuplicates: true } as any);
      }
      // Sincronizar coluna auxiliar em contacts (se existir)
      await supabase
        .from('contacts' as any)
        .update({ list_id: finalListId || null } as any)
        .eq('id', contactId as any);
      try { document.dispatchEvent(new CustomEvent('lists:refresh')); } catch {}
    } catch (e) {
      console.error('Erro ao mover contato de lista:', e);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={ref} className="relative bg-white rounded-lg shadow-lg w-full max-w-xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar contato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lista</label>
            <Select
              onValueChange={(v) => setSelectedListId(v === '__none__' ? '' : v)}
              defaultValue={selectedListId || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma lista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem lista</SelectItem>
                <SelectItem value="__create__">+ Criar nova lista…</SelectItem>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedListId === '__create__' && (
              <input
                className="mt-2 w-full h-10 rounded-md border border-[var(--color-border)] px-3"
                placeholder="Nome da nova lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            )}
          </div>
          <ContactForm
            userId={userId}
            contactId={contactId}
            initialData={{
              name: initialData?.name || '',
              phone: (initialData?.phone || '').replace(/\D/g, ''),
              email: '',
              list_id: '',
              notes: '',
            } as any}
            availableLists={lists}
            onSaved={async () => { await applyListChange(); onClose(); }}
            minimal
          />
        </div>
      </div>
    </div>
  );
}



