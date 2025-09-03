import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Criar tabela de organizações se não existir
    const { error: createOrgError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createOrgError) {
      console.error('Erro ao criar tabela organizations:', createOrgError);
      return NextResponse.json({ error: 'Erro ao criar tabela organizations' }, { status: 500 });
    }

    // 2. Adicionar coluna organization_id na tabela users se não existir
    const { error: alterUsersError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
      `
    });

    if (alterUsersError) {
      console.error('Erro ao adicionar organization_id em users:', alterUsersError);
      return NextResponse.json({ error: 'Erro ao modificar tabela users' }, { status: 500 });
    }

    // 3. Criar organização padrão para o usuário atual se não existir
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'default-org')
      .single();

    let organizationId: string;

    if (!existingOrg) {
      // Criar organização padrão
      const { data: newOrg, error: insertOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Organização Padrão',
          slug: 'default-org'
        })
        .select('id')
        .single();

      if (insertOrgError) {
        console.error('Erro ao criar organização padrão:', insertOrgError);
        return NextResponse.json({ error: 'Erro ao criar organização padrão' }, { status: 500 });
      }

      organizationId = newOrg.id;
    } else {
      organizationId = existingOrg.id;
    }

    // 4. Atualizar usuário atual para pertencer à organização
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ organization_id: organizationId })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('Erro ao atualizar usuário:', updateUserError);
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }

    // 5. Atualizar registros existentes em organization_members
    const { error: updateMembersError } = await supabase
      .from('organization_members')
      .update({ organization_id: organizationId })
      .eq('organization_id', user.id);

    if (updateMembersError) {
      console.error('Erro ao atualizar organization_members:', updateMembersError);
      return NextResponse.json({ error: 'Erro ao atualizar organization_members' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Estrutura de organizações criada com sucesso',
      organizationId: organizationId
    });

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
