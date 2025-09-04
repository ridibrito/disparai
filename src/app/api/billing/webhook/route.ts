import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = (req.headers as any).get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        if (userId && planId) {
          await supabase.from('users').update({ plan_id: planId, updated_at: new Date().toISOString() }).eq('id', userId);
          // Opcional: marcar trial como convertido na org
          await supabase.from('organizations').update({ trial_status: 'converted' }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id as string | undefined;
        if (userId) {
          // Opcional: rebaixar para plano Trial/Básico grátis
          const { data: trial } = await supabase.from('plans').select('id').eq('name', 'Trial').single();
          await supabase.from('users').update({ plan_id: trial?.id ?? null, updated_at: new Date().toISOString() }).eq('id', userId);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('webhook handler error', e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}


