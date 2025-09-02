import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const planId: string | undefined = body.planId;
  if (!planId) return NextResponse.json({ error: 'planId é obrigatório' }, { status: 400 });

  // Validar se o plano existe
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
  }

  // Atualizar o plano do usuário
  const { error: updateError } = await supabase
    .from('users')
    .update({ plan_id: planId, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Falha ao atualizar plano' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}


