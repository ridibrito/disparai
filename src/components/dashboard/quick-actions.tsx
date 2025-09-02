'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Printer, FileDown } from 'lucide-react';

type QuickActionsProps = { showMenu?: boolean };

export function QuickActions({ showMenu = true }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {showMenu && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
        >
          Exportar <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
        </button>
      )}
      {showMenu && open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-md z-10">
          <div className="py-2">
            <button onClick={() => { setOpen(false); window.print(); }} className="w-full text-left flex items-center px-3 py-2 text-sm hover:bg-gray-50">
              <Printer className="w-4 h-4 mr-2 text-gray-600" /> Imprimir
            </button>
            <button onClick={() => { setOpen(false); document.dispatchEvent(new CustomEvent('export-csv')); }} className="w-full text-left flex items-center px-3 py-2 text-sm hover:bg-gray-50">
              <FileDown className="w-4 h-4 mr-2 text-gray-600" /> Exportar CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


