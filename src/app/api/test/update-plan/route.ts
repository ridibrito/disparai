import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 🚀 DESENVOLVIMENTO: Buscar ou criar plano Empresarial
    let businessPlan;
    
    // Primeiro, tentar buscar o plano existente
    const { data: existingPlan, error: planError } = await supabase
      .from('plans')
      .select('id, name')
      .eq('name', 'Empresarial')
      .single();

    if (planError || !existingPlan) {
      // Se não existir, criar o plano Empresarial
      const { data: newPlan, error: createError } = await supabase
        .from('plans')
        .insert({
          name: 'Empresarial',
          description: 'Plano para desenvolvimento',
          features: { users_limit: 5, messages_limit: 1000 },
          price: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Erro ao criar plano Empresarial:', createError);
        return NextResponse.json({ error: 'Falha ao criar plano' }, { status: 500 });
      }
      
      businessPlan = newPlan;
      console.log('✅ Plano Empresarial criado:', businessPlan);
    } else {
      businessPlan = existingPlan;
      console.log('✅ Plano Empresarial encontrado:', businessPlan);
    }

    // Atualizar o plano do usuário na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        plan_id: businessPlan.id, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      return NextResponse.json({ error: 'Falha ao atualizar plano' }, { status: 500 });
    }

    // Garantir entrada na tabela user_plans
    const { error: userPlanError } = await supabase
      .from('user_plans')
      .upsert({
        user_id: user.id,
        plan_id: businessPlan.id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (userPlanError) {
      console.error('Erro ao atualizar user_plans:', userPlanError);
      return NextResponse.json({ error: 'Falha ao atualizar user_plans' }, { status: 500 });
    }

    console.log('✅ Plano alterado para Empresarial com sucesso!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Plano alterado para Empresarial com sucesso!',
      plan: businessPlan,
      features: { users_limit: 5, messages_limit: 1000 }
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
