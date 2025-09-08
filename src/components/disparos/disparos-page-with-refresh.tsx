'use client';

import { useState, useEffect } from 'react';
import { DisparosActions } from '@/components/dashboard/disparos-actions';
import { DisparosTable } from '@/components/dashboard/disparos-table';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Disparo = {
  id: string;
  name: string;
  status: string;
  contact_count?: number | null;
  created_at: string;
  message: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
};

export function DisparosPageWithRefresh() {
  const [disparos, setDisparos] = useState<Disparo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadDisparos = async () => {
    try {
      setIsLoading(true);
      
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar disparos do usuário via API
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        console.error('Erro ao carregar disparos:', response.statusText);
        return;
      }
      
      const disparosRaw = await response.json();
      setDisparos((disparosRaw as Disparo[]) || []);
    } catch (error) {
      console.error('Erro ao carregar disparos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisparos();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Disparos</h1>
              <p className="text-gray-600">Gerencie seus disparos de mensagens em massa.</p>
            </div>
            <DisparosActions />
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando disparos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Disparos</h1>
            <p className="text-gray-600">Gerencie seus disparos de mensagens em massa.</p>
          </div>
          <DisparosActions />
        </div>
      </div>

      {/* Disparos Table */}
      <DisparosTable 
        initialDisparos={disparos} 
        onRefresh={loadDisparos}
      />
    </div>
  );
}
