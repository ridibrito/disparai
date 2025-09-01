'use client';

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface NewFluxoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewFluxoModal({ open, onClose }: NewFluxoModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
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
      <div ref={ref} className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Novo fluxo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3 text-gray-700">
          <p>Em breve: construtor de fluxos com etapas sequenciais (mensagens, atrasos e condições).</p>
        </div>
      </div>
    </div>
  );
}


