import PricingPlans from '@/components/subscription/PricingPlans';
import { createServerClient } from '@/lib/supabaseServer';
import Stripe from 'stripe';

export const metadata = {
  title: 'Planos - disparai',
  description: 'Escolha ou altere seu plano de assinatura',
};

export default async function PlansPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('id, name, price, features');

  const { data: userRow } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user.id)
    .single();

  // Buscar valores reais no Stripe para exibir preços corretos
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null;

  function priceIdForPlanByName(name: string): string | undefined {
    const map: Record<string, string | undefined> = {
      'Básico': process.env.BASIC_MONTH_PRICE_ID,
      'Profissional': process.env.PRO_MONTH_PRICE_ID,
      'Empresarial': process.env.BUSINESS_MONTH_PRICE_ID,
      'Trial': process.env.TRIAL_PRICE_ID,
    };
    return map[name];
  }

  const normalized = await Promise.all((plans || []).map(async (p) => {
    const features = (p.features as any) || {};
    let priceNumber = Number(p.price || 0);
    try {
      const priceId = (features.stripe_price_id as string | undefined) || priceIdForPlanByName(String(p.name));
      if (stripe && priceId) {
        const price = await stripe.prices.retrieve(priceId);
        if (typeof price.unit_amount === 'number') {
          priceNumber = price.unit_amount / 100;
        }
      }
    } catch (e) {
      // fallback para preço do banco
    }
    return {
      id: String(p.id),
      name: String(p.name),
      description: '',
      price: priceNumber,
      interval: 'month' as const,
      features: Object.keys(features).map((k) => `${k}: ${String(features[k])}`),
      contactLimit: Number((features as any).contact_limit || 0),
      deviceLimit: Number((features as any).dispositivos || 0),
      campaignLimit: Number((features as any).campanhas_simultaneas || 0),
    } as any;
  }));

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Planos</h1>
        <p className="text-gray-600">Escolha o plano ideal para o seu negócio.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <PricingPlans plans={normalized as any} currentPlanId={userRow?.plan_id as any} />
        <form action="/api/billing/checkout" method="post" className="hidden" id="checkout-form"></form>
      </div>
    </div>
  );
}


