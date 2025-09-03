'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ContactForm } from './contact-form';
import { createClientComponentClient } from '@/lib/supabase';

type NewContactModalProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export function NewContactModal({ open, onClose, userId }: NewContactModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const loadLists = async () => {
      try {
        const { data: org } = await supabase
          .from('organizations' as any)
          .select('id')
          .eq('id', userId as any)
          .maybeSingle();
        const { data, error } = await supabase
          .from('contact_lists' as any)
          .select('id, name')
          .eq('user_id', userId as any)
          .order('name', { ascending: true });
        if (error) throw error;
        setLists((data as any) || []);
      } catch (e) {
        console.error('Erro ao carregar listas:', e);
      }
    };
    loadLists();
  }, [open, supabase, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={ref} className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Novo contato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <ContactForm userId={userId} onSaved={onClose} onCancel={onClose} availableLists={lists} />
        </div>
      </div>
    </div>
  );
}


