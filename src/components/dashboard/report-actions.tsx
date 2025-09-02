'use client';

import { useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

type CampaignLite = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type ReportActionsProps = {
  campaigns: CampaignLite[];
  contactsTotal: number;
  campaignsTotal: number;
  runningCampaigns: number;
};

export function ReportActions({ campaigns, contactsTotal, campaignsTotal, runningCampaigns }: ReportActionsProps) {
  const exportCsv = () => {
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Total de Contatos', String(contactsTotal)],
      ['Total de Campanhas', String(campaignsTotal)],
      ['Campanhas Ativas', String(runningCampaigns)],
      ['—', '—'],
      ['ID', 'Nome / Status / Criada em'],
      ...campaigns.map((c) => [
        c.id,
        `${c.name} / ${c.status} / ${new Date(c.created_at).toLocaleString('pt-BR')}`,
      ]),
    ];

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  // Ouvir evento global do dropdown Exportar
  useEffect(() => {
    const onExport = () => exportCsv();
    document.addEventListener('export-csv' as any, onExport);
    return () => document.removeEventListener('export-csv' as any, onExport);
  }, []);

  return null;
}


