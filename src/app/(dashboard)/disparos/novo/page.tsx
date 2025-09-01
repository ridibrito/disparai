import { CampaignForm } from '@/components/campaigns/campaign-form';
import { createServerClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'Novo Disparo - DisparaMaker',
  description: 'Crie um novo disparo de mensagens',
};

export default async function NovoDisparoPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Disparo</h1>
        <p className="text-gray-600">Configure e envie mensagens em massa para seus contatos.</p>
      </div>

      {/* Campaign Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <CampaignForm userId={userId} />
      </div>
    </div>
  );
}
