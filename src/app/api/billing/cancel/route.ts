import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createServerClient();
  
  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL));
  }
  
  try {
    // Buscar informações do plano do usuário
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('*, plans(*)')
      .eq('user_id', session.user.id)
      .single();
    
    // Verificar se o usuário tem um plano pago ativo
    const hasPaidPlan = userPlan?.plans?.price > 0 && userPlan?.status === 'active';
    
    if (!hasPaidPlan) {
      return NextResponse.redirect(new URL('/dashboard/settings/billing', process.env.NEXT_PUBLIC_SITE_URL));
    }
    
    // Atualizar status da assinatura para 'canceled'
    // Nota: Em um ambiente real, aqui você integraria com o provedor de pagamentos
    // para cancelar a assinatura no sistema deles também
    const { error } = await supabase
      .from('user_plans')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id);
    
    if (error) throw error;
    
    // Redirecionar para a página de faturamento com mensagem de sucesso
    return NextResponse.redirect(
      new URL('/dashboard/settings/billing?status=canceled', process.env.NEXT_PUBLIC_SITE_URL)
    );
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    // Redirecionar com mensagem de erro
    return NextResponse.redirect(
      new URL('/dashboard/settings/billing?error=true', process.env.NEXT_PUBLIC_SITE_URL)
    );
  }
}