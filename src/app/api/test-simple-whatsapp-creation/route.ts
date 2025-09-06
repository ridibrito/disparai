import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🧪 Teste simples de criação de instância WhatsApp...');

    // 1. Testar inserção na tabela whatsapp_instances
    console.log('1️⃣ Testando inserção na tabela whatsapp_instances...');
    const testInstance = {
      organization_id: '596274e5-69c9-4267-975d-18f6af63c9b2',
      instance_key: `test_simple_${Date.now()}`,
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
        step: 'insert_whatsapp_instance',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testData: testInstance
      }, { status: 500 });
    }

    console.log('✅ Instância de teste inserida:', insertedInstance);

    // 2. Testar inserção na tabela api_connections
    console.log('2️⃣ Testando inserção na tabela api_connections...');
    const testConnection = {
      user_id: '596274e5-69c9-4267-975d-18f6af63c9b2',
      organization_id: '596274e5-69c9-4267-975d-18f6af63c9b2',
      name: 'Teste API Disparai',
      type: 'whatsapp_disparai',
      instance_id: insertedInstance.instance_key,
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
      status: 'active',
      is_active: true,
      provider: 'disparai'
    };

    const { data: insertedConnection, error: connectionError } = await supabaseAdmin
      .from('api_connections')
      .insert(testConnection as any)
      .select()
      .single();

    if (connectionError) {
      console.error('❌ Erro ao inserir conexão de teste:', connectionError);
      return NextResponse.json({
        ok: false,
        step: 'insert_api_connection',
        error: connectionError.message,
        code: connectionError.code,
        details: connectionError.details,
        hint: connectionError.hint,
        testData: testConnection
      }, { status: 500 });
    }

    console.log('✅ Conexão de teste inserida:', insertedConnection);

    // 3. Limpar os testes
    console.log('3️⃣ Limpando dados de teste...');
    await supabaseAdmin
      .from('api_connections')
      .delete()
      .eq('id', insertedConnection.id);

    await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('id', insertedInstance.id);

    console.log('✅ Dados de teste removidos');

    return NextResponse.json({
      ok: true,
      message: 'Todos os testes passaram com sucesso!',
      results: {
        whatsappInstance: insertedInstance,
        apiConnection: insertedConnection
      }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
