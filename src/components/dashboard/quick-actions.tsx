'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Upload } from 'lucide-react';
import { NewDisparoModal } from './new-disparo-modal';

type QuickActionsProps = { showMenu?: boolean };

export function QuickActions({ showMenu = true }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const [openDisparo, setOpenDisparo] = useState(false);
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
      <button
        onClick={() => {
          if (showMenu) setOpen((v) => !v);
          else setOpenDisparo(true);
        }}
        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#4bca59' }}
      >
        <span className="absolute -top-1 -right-1 inline-flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        {showMenu ? (
          <>Ações rápidas <ChevronDown className="w-4 h-4 ml-2 opacity-90" /></>
        ) : (
          <>Novo disparo</>
        )}
      </button>
      {showMenu && open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-md z-10">
          <div className="py-2">
            <button onClick={() => { setOpen(false); setOpenDisparo(true); }} className="w-full text-left flex items-center px-3 py-2 text-sm hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-2 text-gray-600" /> Novo disparo
            </button>
            <Link href="/contatos" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2 text-gray-600" /> Importar contatos
            </Link>
            
          </div>
        </div>
      )}
      <NewDisparoModal open={openDisparo} onClose={() => setOpenDisparo(false)} />
    </div>
  );
}


