import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Verificar se a tabela existe e listar todas as instâncias
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
      return NextResponse.json({ 
        ok: false, 
        error: instancesError.message,
        code: instancesError.code
      }, { status: 500 });
    }

    // Verificar estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'whatsapp_instances' });

    return NextResponse.json({
      ok: true,
      instances: instances || [],
      instancesCount: instances?.length || 0,
      tableInfo: tableError ? 'Erro ao obter info da tabela: ' + tableError.message : tableInfo,
      message: 'Tabela whatsapp_instances acessível'
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
    const { testData } = await req.json();
    const supabase = await createServerClient();
    
    // Teste de inserção
    const testInstance = {
      organization_id: 'test-org',
      instance_key: `test_${Date.now()}`,
      token: 'test-token',
      status: 'pendente',
      webhook_url: 'http://test.com/webhook'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(testInstance as any)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        ok: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 });
    }

    // Deletar o teste
    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', inserted.id);

    return NextResponse.json({
      ok: true,
      message: 'Teste de inserção bem-sucedido',
      insertedData: inserted
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
