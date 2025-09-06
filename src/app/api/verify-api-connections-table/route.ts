import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Verificando tabela api_connections...');

    // Verificar se a tabela existe
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .limit(5);

    if (connectionsError) {
      console.error('❌ Erro ao acessar tabela api_connections:', connectionsError);
      return NextResponse.json({
        ok: false,
        error: connectionsError.message,
        code: connectionsError.code,
        details: connectionsError.details,
        hint: connectionsError.hint
      }, { status: 500 });
    }

    console.log('✅ Tabela api_connections acessível');
    
    // Verificar estrutura da tabela
    const { data: tableStructure, error: structureError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'api_connections' });

    return NextResponse.json({
      ok: true,
      message: 'Tabela api_connections acessível',
      connectionsCount: connections?.length || 0,
      connections: connections || [],
      tableStructure: structureError ? 'Erro ao obter estrutura: ' + structureError.message : tableStructure
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { testConnection } = await req.json();
    
    console.log('🧪 Testando inserção na tabela api_connections...');

    // Dados de teste para api_connections
    const testData = {
      user_id: testConnection?.userId || 'test-user-id',
      organization_id: testConnection?.organizationId || 'test-org',
      name: 'Teste API Disparai',
      type: 'whatsapp_disparai',
      instance_key: `test_${Date.now()}`,
      api_key: 'test-api-key',
      status: 'active',
      is_active: true
    };

    // Tentar inserir
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('api_connections')
      .insert(testData as any)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir teste na api_connections:', insertError);
      return NextResponse.json({
        ok: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testData: testData
      }, { status: 500 });
    }

    console.log('✅ Teste inserido com sucesso:', inserted);

    // Limpar o teste
    const { error: deleteError } = await supabaseAdmin
      .from('api_connections')
      .delete()
      .eq('id', inserted.id);

    if (deleteError) {
      console.error('⚠️ Erro ao limpar teste (não crítico):', deleteError);
    }

    return NextResponse.json({
      ok: true,
      message: 'Tabela api_connections funcionando corretamente!',
      testResult: inserted
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
