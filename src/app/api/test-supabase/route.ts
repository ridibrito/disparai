import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Testando conexão com Supabase...');
    console.log('👤 User ID:', user.id);

    // Obter organization_id do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao obter perfil do usuário:', userError);
      return NextResponse.json({ 
        error: 'User profile error', 
        details: userError.message 
      }, { status: 500 });
    }

    if (!userProfile?.organization_id) {
      console.error('❌ Usuário sem organization_id:', user.id);
      return NextResponse.json({ 
        error: 'User has no organization' 
      }, { status: 400 });
    }

    console.log('🏢 Organization ID:', userProfile.organization_id);

    // Testar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('api_connections')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ Erro ao acessar tabela api_connections:', tablesError);
      return NextResponse.json({ 
        error: 'Table access error', 
        details: tablesError.message,
        code: tablesError.code 
      }, { status: 500 });
    }

    console.log('✅ Tabela api_connections acessível');
    console.log('📊 Dados encontrados:', tables?.length || 0);

    // Testar inserção simples (apenas campos obrigatórios)
    const testData = {
      user_id: user.id,
      organization_id: userProfile.organization_id,
      name: 'Teste de Conexão',
      type: 'whatsapp_disparai',
      instance_id: 'teste_123',
      api_key: 'teste_key',
      api_secret: 'teste_secret', // Campo obrigatório
      is_active: true,
      status: 'active'
    };

    console.log('🧪 Testando inserção...');
    const { data: insertResult, error: insertError } = await supabase
      .from('api_connections')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      return NextResponse.json({ 
        error: 'Insert error', 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }

    console.log('✅ Inserção bem-sucedida:', insertResult);

    // Limpar o teste
    await supabase
      .from('api_connections')
      .delete()
      .eq('id', insertResult.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working',
      user: user.id,
      testInsert: insertResult
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      error: 'General error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
