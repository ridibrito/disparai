import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = user.id;
    
    // Verificar estrutura da tabela organization_members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', userId);

    // Verificar estrutura da tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('id', userId);

    // Verificar se há relacionamento
    const { data: membersWithUsers, error: relationError } = await supabase
      .from('organization_members')
      .select(`
        user_id, 
        role, 
        users!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', userId);

    console.log('🔍 Debug - Estrutura das tabelas:');
    console.log('👤 Usuário atual:', { id: userId });
    console.log('👥 Members encontrados:', members);
    console.log('❌ Erro members:', membersError);
    console.log('👤 User data:', users);
    console.log('❌ Erro users:', usersError);
    console.log('🔗 Relacionamento:', membersWithUsers);
    console.log('❌ Erro relacionamento:', relationError);

    return NextResponse.json({ 
      success: true,
      debug: {
        userId,
        members,
        users,
        membersWithUsers,
        errors: {
          members: membersError,
          users: usersError,
          relation: relationError
        }
      }
    });

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
