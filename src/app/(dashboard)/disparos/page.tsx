import Link from 'next/link';
import { createServerClient } from '@/lib/supabaseServer';
import { Plus, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { DisparosActions } from '@/components/dashboard/disparos-actions';

export const metadata = {
  title: 'Disparos - DisparaMaker',
  description: 'Gerencie seus disparos de mensagens',
};

export default async function DisparosPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const currentOrgId = session?.user?.id || '';
  
  // Buscar disparos do usuário
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false });

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Disparos</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns?.filter(c => c.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Em Execução</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns?.filter(c => c.status === 'running').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Falharam</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns?.filter(c => c.status === 'failed').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Histórico de Disparos</h2>
        </div>
        
        {campaigns && campaigns.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(campaign.status)}
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">
                        {campaign.contact_count || 0} contatos • 
                        Criado em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(campaign.status)}
                    </span>
                    <Link
                      href={`/disparos/${campaign.id}`}
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum disparo encontrado</h3>
            <p className="text-gray-500 mb-6">Crie seu primeiro disparo para começar a enviar mensagens.</p>
            <DisparosActions />
          </div>
        )}
      </div>
    </div>
  );
}
