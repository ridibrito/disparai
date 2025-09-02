'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RangeKey = '7d' | 'month' | 'year' | 'custom';

export function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [range, setRange] = useState<RangeKey>((sp.get('range') as RangeKey) || '7d');
  const [from, setFrom] = useState<string>(sp.get('from') || '');
  const [to, setTo] = useState<string>(sp.get('to') || '');

  // Persistir em localStorage e aplicar rota ao trocar range
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    if (range !== 'custom') {
      setFrom('');
      setTo('');
      params.set('range', range);
      params.delete('from');
      params.delete('to');
      router.replace(`${pathname}?${params.toString()}`);
    }
    try { localStorage.setItem('dashboard-period', JSON.stringify({ range, from: '', to: '' })); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Auto-aplicar quando datas mudarem
  useEffect(() => {
    if (!from || !to) return;
    if (new Date(from) > new Date(to)) return;
    const params = new URLSearchParams(sp.toString());
    params.set('range', 'custom');
    params.set('from', from);
    params.set('to', to);
    router.replace(`${pathname}?${params.toString()}`);
    try { localStorage.setItem('dashboard-period', JSON.stringify({ range: 'custom', from, to })); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Restaurar seleção salva quando não houver query string
  useEffect(() => {
    if (sp.get('range')) return;
    try {
      const raw = localStorage.getItem('dashboard-period');
      if (!raw) return;
      const saved = JSON.parse(raw) as { range: RangeKey; from?: string; to?: string };
      setRange(saved.range || '7d');
      setFrom(saved.from || '');
      setTo(saved.to || '');
      const params = new URLSearchParams();
      params.set('range', saved.range || '7d');
      if (saved.range === 'custom' && saved.from && saved.to) {
        params.set('from', saved.from);
        params.set('to', saved.to);
      }
      router.replace(`${pathname}?${params.toString()}`);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
        <SelectTrigger className="w-40 h-11">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="month">Este mês</SelectItem>
          <SelectItem value="year">Este ano</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11" />
      </div>
    </div>
  );
}


