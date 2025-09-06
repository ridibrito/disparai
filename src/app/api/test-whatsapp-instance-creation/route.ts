import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { organizationId = 'test-org' } = await req.json();
    
    console.log('🧪 Testando criação de instância WhatsApp...');

    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela whatsapp_instances existe...');
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('❌ Tabela não existe ou não é acessível:', tableError);
      return NextResponse.json({
        ok: false,
        step: 'table_check',
        error: tableError.message,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      }, { status: 500 });
    }

    console.log('✅ Tabela existe e é acessível');

    // 2. Tentar inserir uma instância de teste
    console.log('2️⃣ Testando inserção de instância...');
    const testInstance = {
      organization_id: organizationId,
      instance_key: `test_${Date.now()}`,
      token: 'test-token',
      status: 'pendente',
      webhook_url: 'http://test.com/webhook'
    };

    const { data: insertedInstance, error: insertError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert(testInstance as any)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir instância de teste:', insertError);
      return NextResponse.json({
        ok: false,
        step: 'insert_test',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testData: testInstance
      }, { status: 500 });
    }

    console.log('✅ Instância de teste inserida com sucesso:', insertedInstance);

    // 3. Verificar se consegue buscar a instância inserida
    console.log('3️⃣ Verificando se consegue buscar a instância inserida...');
    const { data: retrievedInstance, error: retrieveError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', insertedInstance.id)
      .single();

    if (retrieveError) {
      console.error('❌ Erro ao buscar instância inserida:', retrieveError);
      return NextResponse.json({
        ok: false,
        step: 'retrieve_test',
        error: retrieveError.message,
        insertedInstance: insertedInstance
      }, { status: 500 });
    }

    console.log('✅ Instância recuperada com sucesso:', retrievedInstance);

    // 4. Limpar o teste
    console.log('4️⃣ Limpando instância de teste...');
    const { error: deleteError } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('id', insertedInstance.id);

    if (deleteError) {
      console.error('⚠️ Erro ao deletar instância de teste (não crítico):', deleteError);
    } else {
      console.log('✅ Instância de teste removida');
    }

    // 5. Testar a criação real via API
    console.log('5️⃣ Testando criação real via API...');
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/create-whatsapp-instance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        organizationId: organizationId
      })
    });

    const apiResult = await apiResponse.json();
    console.log('📡 Resposta da API de criação:', apiResult);

    return NextResponse.json({
      ok: true,
      message: 'Todos os testes passaram com sucesso!',
      steps: {
        tableCheck: '✅ Tabela existe e é acessível',
        insertTest: '✅ Inserção funcionando',
        retrieveTest: '✅ Busca funcionando',
        cleanup: deleteError ? '⚠️ Limpeza com aviso' : '✅ Limpeza OK',
        apiTest: apiResponse.ok ? '✅ API funcionando' : '❌ API com erro'
      },
      testResults: {
        insertedInstance,
        retrievedInstance,
        apiResult
      }
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
