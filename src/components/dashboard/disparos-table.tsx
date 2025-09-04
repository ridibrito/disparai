'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DisparoActions } from '@/components/disparos/disparo-actions';

type Disparo = {
  id: string;
  name: string;
  status: string;
  contact_count?: number | null;
  created_at: string;
};

type DisparosTableProps = {
  initialDisparos: Disparo[];
  onRefresh?: () => void;
};

function statusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'running':
      return 'Em execução';
    case 'failed':
      return 'Falhou';
    default:
      return 'Pendente';
  }
}

export function DisparosTable({ initialDisparos, onRefresh }: DisparosTableProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return initialDisparos.filter((d) => {
      const matchText =
        search === '' || d.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === '' || d.status === status;
      return matchText && matchStatus;
    });
  }, [initialDisparos, search, status]);

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar disparos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">Todos status</option>
            <option value="running">Em execução</option>
            <option value="completed">Concluído</option>
            <option value="failed">Falhou</option>
            <option value="pending">Pendente</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                  <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Nome</th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Contatos</th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Criado em</th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--color-text-secondary)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                    <td className="py-3 px-4">{d.name}</td>
                    <td className="py-3 px-4">{statusText(d.status)}</td>
                    <td className="py-3 px-4">{d.contact_count ?? 0}</td>
                    <td className="py-3 px-4">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4">
                      <DisparoActions 
                        disparo={d} 
                        onStatusChange={onRefresh}
                      />
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
                {[10, 20, 50].map((s) => (
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
        <div className="text-center py-8 border rounded-md bg-[var(--color-background)]">
          <p className="text-[var(--color-text-secondary)]">Nenhum disparo encontrado.</p>
        </div>
      )}
    </div>
  );
}


