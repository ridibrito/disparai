import { createServerClient } from '@/lib/supabaseServer';
import { PlanSummary as DashboardPlanSummary } from '@/components/dashboard/plan-summary';
import { ReportActions } from '@/components/dashboard/report-actions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Users, Layers, Clock, AlertTriangle, MessageCircle, UserPlus } from 'lucide-react';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Dashboard - disparai',
  description: 'Gerencie suas campanhas e mensagens de WhatsApp',
};

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // Buscar informações da organização do usuário
  let organizationInfo: any = null;
  let currentOrgId = userId;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userData?.organization_id) {
      currentOrgId = userData.organization_id;
      
      // Buscar informações da organização
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, company_name, owner_name')
        .eq('id', currentOrgId)
        .single();
        
      if (orgData) {
        organizationInfo = orgData;
      }
    }
  } catch (error) {
    console.log('Erro ao buscar organização:', error);
  }
  
  // Filtro por período via query string (cookies precisa ser aguardado)
  const cookieStore = await cookies();
  const searchParams = new URLSearchParams(cookieStore.get('next-url-qs')?.value || '');
  const range = searchParams.get('range') || '7d';
  let fromISO: string | null = null;
  let toISO: string | null = null;
  const now = new Date();
  if (range === '7d') {
    fromISO = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  } else if (range === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    fromISO = d.toISOString();
  } else if (range === 'year') {
    const d = new Date(now.getFullYear(), 0, 1);
    fromISO = d.toISOString();
  } else if (range === 'custom') {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) fromISO = new Date(from).toISOString();
    if (to) toISO = new Date(new Date(to).getTime() + 24 * 3600 * 1000 - 1).toISOString();
  }
  async function withRange(query: any) {
    if (fromISO) query = query.gte('created_at', fromISO);
    if (toISO) query = query.lte('created_at', toISO);
    return query;
  }

  const contactsCountPromise = withRange(
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId)
  );
  const campaignsCountPromise = withRange(
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId)
  );
  const recentCampaignsPromise = withRange(
    supabase.from('campaigns').select('id, name, status, created_at').eq('organization_id', currentOrgId)
      .order('created_at', { ascending: false }).limit(5)
  );
  const failedCountPromise = withRange(
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId).eq('status', 'failed')
  );
  const activeChatsPromise = supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId).eq('status', 'active');
  const leads7dPromise = supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', currentOrgId)
    .eq('status', 'active')
    .gte('created_at', new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString());

  const [
    { count: contactsCount },
    { count: campaignsCount },
    { data: recentCampaignsRaw },
    { count: failedCount },
    { count: activeChatsCount },
    { count: leads7dCount },
  ] = await Promise.all([
    contactsCountPromise,
    campaignsCountPromise,
    recentCampaignsPromise,
    failedCountPromise,
    activeChatsPromise,
    leads7dPromise,
  ]);

  const runningCount = (recentCampaignsRaw || []).filter((c: any) => c.status === 'running').length;

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral da sua empresa.</p>
        
        {/* Informações da Empresa */}
        {organizationInfo && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {organizationInfo.company_name?.charAt(0) || 'E'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {organizationInfo.company_name || organizationInfo.name}
                </h3>
                <p className="text-sm text-gray-600">
                  👑 Proprietário: {organizationInfo.owner_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-emerald-50">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Contatos</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{contactsCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total cadastrados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-sky-50">
              <Layers className="w-5 h-5 text-sky-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Campanhas</h3>
          </div>
          <p className="text-3xl font-bold text-sky-600">{campaignsCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total criadas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Em execução</h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">{runningCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Campanhas ativas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-rose-50">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Falhas em envios</h3>
          </div>
          <p className="text-3xl font-bold text-rose-600">{failedCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Campanhas com erro</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-violet-50">
              <MessageCircle className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Conversas ativas</h3>
          </div>
          <p className="text-3xl font-bold text-violet-600">{activeChatsCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Chat em andamento</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6  hover:shadow-md transition-shadow ">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-teal-50">
              <UserPlus className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Leads (7 dias)</h3>
          </div>
          <p className="text-3xl font-bold text-teal-600">{leads7dCount || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Conversas iniciadas nos últimos 7 dias</p>
        </div>
      </div>
      
      {/* Plan Summary */}
      <div>
        {user?.id && <DashboardPlanSummary userId={user.id} />}
      </div>
      
      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Campanhas Recentes</h3>
        {(recentCampaignsRaw && (recentCampaignsRaw as any).length > 0) ? (
          <div className="divide-y divide-gray-200">
            {(recentCampaignsRaw as any).map((c: any) => (
              <div key={c.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString('pt-BR')} • {c.status}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  c.status === 'completed' ? 'bg-green-100 text-green-800' :
                  c.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                  c.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma campanha recente.</p>
          </div>
        )}
      </div>
    </div>
  );
}