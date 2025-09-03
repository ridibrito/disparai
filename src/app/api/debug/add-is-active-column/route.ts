import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Adicionar coluna is_active se não existir
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE organization_members 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      `
    });

    if (alterError) {
      console.error('Erro ao adicionar coluna:', alterError);
      return NextResponse.json({ error: 'Erro ao adicionar coluna' }, { status: 500 });
    }

    // Atualizar registros existentes para ter is_active = true
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ is_active: true })
      .is('is_active', null);

    if (updateError) {
      console.error('Erro ao atualizar registros:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar registros' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Coluna is_active adicionada com sucesso' 
    });

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
