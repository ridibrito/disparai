import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function getPriceIdForPlanName(name: string): string | null {
  const map: Record<string, string | undefined> = {
    'Básico': process.env.BASIC_MONTH_PRICE_ID,
    'Profissional': process.env.PRO_MONTH_PRICE_ID,
    'Empresarial': process.env.BUSINESS_MONTH_PRICE_ID,
    'Trial': process.env.TRIAL_PRICE_ID, // opcional
  };
  return map[name] || null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { planId } = body as { planId?: string };
    if (!planId) return NextResponse.json({ error: 'planId é obrigatório' }, { status: 400 });

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, features')
      .eq('id', planId)
      .single();
    if (planError || !plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const features = (plan.features as any) || {};
    const priceId = (features.stripe_price_id as string | undefined) || getPriceIdForPlanName(plan.name as unknown as string);
    if (!priceId) {
      return NextResponse.json({ error: `Stripe Price ID ausente. Defina features.stripe_price_id no plano ${plan.name} (ou as envs PRICE_ID).` }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      customer_email: user.email || undefined,
      success_url: `${getBaseUrl()}/configuracoes/assinatura?status=success`,
      cancel_url: `${getBaseUrl()}/configuracoes/assinatura?status=canceled`,
      metadata: {
        user_id: user.id,
        plan_id: String(plan.id),
        plan_name: String(plan.name),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'Falha ao iniciar checkout' }, { status: 500 });
  }
}


