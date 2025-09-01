import PricingPlans from '@/components/subscription/PricingPlans';
import { createServerClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'Planos - DisparaMaker',
  description: 'Escolha ou altere seu plano de assinatura',
};

export default async function PlansPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || '';

  // Planos estáticos de exemplo; integrar com tabela prices/products se necessário
  const plans = [
    { id: 'basic-month', name: 'Básico', description: 'Para começar', price: 29.9, interval: 'month', features: ['1 dispositivo', '2.000 contatos'], contactLimit: 2000, deviceLimit: 1, campaignLimit: 2 },
    { id: 'pro-month', name: 'Pro', description: 'Para escalar', price: 99.9, interval: 'month', features: ['3 dispositivos', '20.000 contatos'], contactLimit: 20000, deviceLimit: 3, campaignLimit: 10, highlighted: true },
    { id: 'business-month', name: 'Business', description: 'Alto volume', price: 299.9, interval: 'month', features: ['10 dispositivos', '100.000 contatos'], contactLimit: 100000, deviceLimit: 10, campaignLimit: 50 },
    { id: 'basic-year', name: 'Básico', description: 'Para começar', price: 299.0, interval: 'year', features: ['1 dispositivo', '2.000 contatos'], contactLimit: 2000, deviceLimit: 1, campaignLimit: 2 },
    { id: 'pro-year', name: 'Pro', description: 'Para escalar', price: 999.0, interval: 'year', features: ['3 dispositivos', '20.000 contatos'], contactLimit: 20000, deviceLimit: 3, campaignLimit: 10, highlighted: true },
    { id: 'business-year', name: 'Business', description: 'Alto volume', price: 2999.0, interval: 'year', features: ['10 dispositivos', '100.000 contatos'], contactLimit: 100000, deviceLimit: 10, campaignLimit: 50 },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Planos</h1>
        <p className="text-gray-600">Escolha o plano ideal para o seu negócio.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <PricingPlans plans={plans as any} currentPlanId={undefined} />
      </div>
    </div>
  );
}


