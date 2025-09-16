import PricingPlans from '@/components/subscription/PricingPlans';
import { createServerClient } from '@/lib/supabaseServer';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Assinatura - Configurações - disparai',
  description: 'Gerencie seu plano e pagamentos',
};

export default async function AssinaturaPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, price, features');

  const { data: me } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user.id)
    .single();

  const normalized = (plans || []).map((p) => {
    const f = (p.features as any) || {};
    return {
      id: p.id as unknown as string,
      name: String(p.name),
      description: '',
      price: Number(p.price || 0),
      interval: 'month' as const,
      features: Object.keys(f).map((k) => `${k}: ${String(f[k])}`),
      contactLimit: Number(f.contact_limit || 0),
      deviceLimit: Number(f.dispositivos || 0),
      campaignLimit: Number(f.campanhas_simultaneas || 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assinatura</h1>
          <p className="text-gray-600">Gerencie seu plano atual e explore outras opções.</p>
        </div>
        <BackButton />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <PricingPlans plans={normalized as any} currentPlanId={me?.plan_id as any} />
      </div>
    </div>
  );
}
