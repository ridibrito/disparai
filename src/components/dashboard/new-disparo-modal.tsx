'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface NewDisparoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewDisparoModal({ open, onClose }: NewDisparoModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedList, setSelectedList] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');

  const mockLists = [
    { id: 'leads', name: 'Leads' },
    { id: 'clientes', name: 'Clientes' },
    { id: 'vip', name: 'VIP' },
  ];

  const mockTemplates: { id: string; name: string; content: string }[] = [
    { id: 'boasvindas', name: 'Boas-vindas', content: 'Olá {{nome}}, bem-vindo! Como posso ajudar?' },
    { id: 'promocao', name: 'Promoção', content: 'Oi {{nome}}, temos uma condição especial para você hoje!' },
    { id: 'cobranca', name: 'Cobrança', content: 'Olá {{nome}}, identificamos um pagamento pendente. Podemos falar?' },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    if (open) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onClick);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div ref={ref} className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Novo disparo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form className="p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Lista para disparo</label>
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: '#4bca59' }}
            >
              <option value="">Selecione uma lista</option>
              {mockLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Modelo de mensagem</label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const t = mockTemplates.find(t => t.id === e.target.value);
                  setSelectedTemplate(e.target.value);
                  if (t) setMessage(t.content);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#4bca59' }}
              >
                <option value="">Sem modelo</option>
                {mockTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Pré-visualização</label>
              <div className="text-xs text-gray-600 border border-dashed border-gray-300 rounded-md px-3 py-2 min-h-[40px]">
                {message || 'Mensagem em branco'}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: '#4bca59' }}
              placeholder="Digite sua mensagem ou selecione um modelo"
            />
            <p className="mt-1 text-xs text-gray-500">{'Suporta variáveis como {{nome}} (apenas visual).'}</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Cancelar</button>
            <button type="submit" className="px-3 py-2 text-sm rounded-md text-white" style={{ backgroundColor: '#4bca59' }}>Continuar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


