import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usar o cliente admin para criar tabelas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🔧 Configurando tabela whatsapp_instances (método alternativo)...');

    // Primeiro, verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tabela whatsapp_instances já existe!');
      return NextResponse.json({
        ok: true,
        message: 'Tabela whatsapp_instances já existe e está acessível',
        existingTable: existingTable
      });
    }

    console.log('⚠️ Tabela não existe ou não é acessível:', checkError.message);

    // Se a tabela não existe, vamos tentar criar usando SQL direto
    try {
      // Usar o cliente admin para executar SQL
      const { data: sqlResult, error: sqlError } = await supabaseAdmin
        .rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS whatsapp_instances (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              organization_id TEXT NOT NULL,
              instance_key TEXT NOT NULL UNIQUE,
              token TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'desconectado')),
              webhook_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (sqlError) {
        console.error('❌ Erro ao executar SQL:', sqlError);
        return NextResponse.json({
          ok: false,
          error: sqlError.message,
          code: sqlError.code,
          details: sqlError.details
        }, { status: 500 });
      }

      console.log('✅ Tabela criada via SQL:', sqlResult);

    } catch (sqlExecError) {
      console.error('❌ Erro ao executar SQL direto:', sqlExecError);
      
      // Se não conseguir executar SQL, vamos tentar uma abordagem diferente
      // Vamos tentar inserir um registro de teste para ver se a tabela existe
      const testRecord = {
        organization_id: 'test-setup',
        instance_key: `test_${Date.now()}`,
        token: 'test-token',
        status: 'pendente',
        webhook_url: 'http://test.com/webhook'
      };

      const { data: testInsert, error: testError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert(testRecord as any)
        .select()
        .single();

      if (testError) {
        console.error('❌ Erro ao inserir teste:', testError);
        return NextResponse.json({
          ok: false,
          error: 'Tabela não existe e não foi possível criar. Erro: ' + testError.message,
          code: testError.code,
          details: testError.details,
          hint: testError.hint
        }, { status: 500 });
      }

      // Se conseguiu inserir, deletar o teste
      await supabaseAdmin
        .from('whatsapp_instances')
        .delete()
        .eq('id', testInsert.id);

      console.log('✅ Tabela existe e está funcionando!');
    }

    // Verificar novamente se a tabela está acessível
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (finalError) {
      return NextResponse.json({
        ok: false,
        error: 'Tabela ainda não está acessível: ' + finalError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Tabela whatsapp_instances configurada e acessível!',
      finalCheck: finalCheck
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
