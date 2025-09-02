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

export default async function Dashboard() {
  const supabase = await createServerClient();
  
  // Verificar se o usuário está autenticado (forma segura)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Se não estiver autenticado, redirecionar para a página de login
  // if (!session) {
  //   redirect('/auth/login');
  // }
  
  // Métricas
  const userId = user?.id || '';
  // Em multi-tenant, usamos a organização atual = id do usuário (seed) por enquanto
  const currentOrgId = userId;
  // Filtro por período via query string
  const searchParams = new URLSearchParams(cookies().get('next-url-qs')?.value || '');
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
  const [
    { count: contactsCount },
    { count: campaignsCount },
    { data: recentCampaignsRaw },
    { count: failedCount },
    { count: activeChatsCount },
    { count: leads7dCount },
  ] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId)
      .gte(fromISO ? 'created_at' : 'id', fromISO || undefined as any)
      .lte(toISO ? 'created_at' : 'id', toISO || undefined as any),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId)
      .gte(fromISO ? 'created_at' : 'id', fromISO || undefined as any)
      .lte(toISO ? 'created_at' : 'id', toISO || undefined as any),
    supabase.from('campaigns').select('id, name, status, created_at').eq('organization_id', currentOrgId)
      .gte(fromISO ? 'created_at' : 'id', fromISO || undefined as any)
      .lte(toISO ? 'created_at' : 'id', toISO || undefined as any)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId).eq('status', 'failed')
      .gte(fromISO ? 'created_at' : 'id', fromISO || undefined as any)
      .lte(toISO ? 'created_at' : 'id', toISO || undefined as any),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId).eq('status', 'active'),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', currentOrgId)
      .gte('created_at', new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString()),
  ]);

  const runningCount = (recentCampaignsRaw || []).filter((c: any) => c.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumo de contatos, campanhas e atividades recentes.</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter />
          <QuickActions />
          <ReportActions 
            campaigns={(recentCampaignsRaw as any) || []}
            contactsTotal={contactsCount || 0}
            campaignsTotal={campaignsCount || 0}
            runningCampaigns={runningCount || 0}
          />
        </div>
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
          <p className="text-xs text-gray-500 mt-1">Contatos novos</p>
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