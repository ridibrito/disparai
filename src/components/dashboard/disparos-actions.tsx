'use client';

import { useState } from 'react';
import { Plus, Workflow } from 'lucide-react';
import { NewDisparoModal } from './new-disparo-modal';
import { NewFluxoModal } from './new-fluxo-modal';

export function DisparosActions() {
  const [openDisparo, setOpenDisparo] = useState(false);
  const [openFluxo, setOpenFluxo] = useState(false);

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setOpenDisparo(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#4bca59' }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo disparo
      </button>
      <button
        onClick={() => setOpenFluxo(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        <Workflow className="w-4 h-4 mr-2" />
        Novo fluxo
      </button>
      <NewDisparoModal open={openDisparo} onClose={() => setOpenDisparo(false)} />
      <NewFluxoModal open={openFluxo} onClose={() => setOpenFluxo(false)} />
    </div>
  );
}


