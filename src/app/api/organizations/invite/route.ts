import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, role, organizationId, redirectTo } = await req.json();
    if (!email || !organizationId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // Verifica se quem chama é owner/admin na org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    if (!member || !['owner','admin'].includes((member as any).role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    let userId: string;
    let isNewUser = false;

    // Primeiro, tentar buscar usuário existente por email
    try {
      const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Erro ao listar usuários:', listError);
        return NextResponse.json({ error: 'Erro ao verificar usuários existentes' }, { status: 500 });
      }

      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Usuário já existe, usar o ID dele
        userId = existingUser.id;
        console.log('✅ Usuário existente encontrado:', existingUser.email);
      } else {
        // Usuário não existe, criar convite
        console.log('📧 Criando convite para novo usuário:', email);
        const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { 
          redirectTo, 
          data: { full_name: name || null } 
        });
        
        if (inviteError) {
          console.error('Erro ao criar convite:', inviteError);
          return NextResponse.json({ error: inviteError.message }, { status: 400 });
        }
        
        userId = invite.user?.id;
        isNewUser = true;
      }
    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      return NextResponse.json({ error: 'Erro ao processar usuário' }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não foi possível obter ID do usuário' }, { status: 500 });
    }

    // Verificar se o usuário já é membro da organização
    const { data: alreadyMember } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (alreadyMember) {
      return NextResponse.json({ 
        error: 'Usuário já é membro desta organização',
        userId: userId
      }, { status: 400 });
    }

    // IMPORTANTE: Inserir usuário na tabela users se não existir
    try {
      // Verificar se o usuário já existe na tabela users
      const { data: existingUserInTable, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Usuário não existe na tabela users, criar registro
        console.log('📝 Criando registro na tabela users para:', userId);
        
        const { error: insertUserError } = await supabase
          .from('users')
          .insert({
            id: userId,
            full_name: name || email.split('@')[0], // Usar nome fornecido ou email como fallback
            email: email,
            organization_id: organizationId
          } as any);

        if (insertUserError) {
          console.error('❌ Erro ao inserir usuário na tabela users:', insertUserError);
          // Não falhar aqui, apenas logar o erro
        } else {
          console.log('✅ Usuário inserido na tabela users:', userId);
        }
      } else if (existingUserInTable) {
        console.log('✅ Usuário já existe na tabela users:', userId);
      }
    } catch (userTableError) {
      console.error('⚠️ Erro ao verificar/criar usuário na tabela users:', userTableError);
      // Não falhar aqui, apenas logar o erro
    }

    // Adicionar usuário à organização
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({ 
        organization_id: organizationId, 
        user_id: userId, 
        role: role || 'agent' 
      } as any);

    if (insertError) {
      console.error('Erro ao inserir membro:', insertError);
      return NextResponse.json({ error: 'Erro ao adicionar usuário à organização' }, { status: 500 });
    }

    console.log('✅ Usuário adicionado à organização:', { userId, email, isNewUser });

    return NextResponse.json({ 
      ok: true, 
      message: isNewUser ? 'Convite enviado e usuário adicionado à organização' : 'Usuário existente adicionado à organização',
      userId: userId,
      isNewUser: isNewUser
    });

  } catch (e: any) {
    console.error('Erro geral na API de convite:', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


