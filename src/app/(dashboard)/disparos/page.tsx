import { createServerClient } from '@/lib/supabaseServer';
import { DisparosActions } from '@/components/dashboard/disparos-actions';
import { CampaignsTable } from '@/components/dashboard/campaigns-table';

export const metadata = {
  title: 'Disparos - disparai',
  description: 'Gerencie seus disparos de mensagens',
};

export default async function DisparosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentOrgId = user?.id || '';
  
  // Buscar disparos do usuário
  const { data: campaignsRaw } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false });
  const campaigns = (campaignsRaw as any[]) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
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
  };

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

      {/* Campaigns Table */}
      <CampaignsTable initialCampaigns={campaigns as any} />
    </div>
  );
}
