import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🔧 Configurando tabela whatsapp_instances...');

    // Primeiro, tentar verificar se a tabela existe
    const { data: tableCheck, error: checkError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tabela whatsapp_instances já existe!');
      return NextResponse.json({
        ok: true,
        message: 'Tabela whatsapp_instances já existe e está acessível',
        tableCheck: tableCheck
      });
    }

    console.log('⚠️ Tabela não existe ou não é acessível:', checkError.message);

    // Se não existe, vamos tentar criar usando SQL direto via RPC
    try {
      const { data: createResult, error: createError } = await supabaseAdmin
        .rpc('exec_sql', {
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

            CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_key ON whatsapp_instances(instance_key);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

            ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow all operations for testing" ON whatsapp_instances;
            CREATE POLICY "Allow all operations for testing" ON whatsapp_instances
              FOR ALL USING (true) WITH CHECK (true);

            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_whatsapp_instances_updated_at ON whatsapp_instances;
            CREATE TRIGGER update_whatsapp_instances_updated_at 
              BEFORE UPDATE ON whatsapp_instances 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();
          `
        });

      if (createError) {
        console.error('❌ Erro ao criar tabela via RPC:', createError);
        
        // Se não conseguir via RPC, vamos tentar uma abordagem diferente
        // Vamos tentar inserir um registro de teste para ver se conseguimos criar a tabela
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
            error: 'Não foi possível criar ou acessar a tabela. Erro: ' + testError.message,
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

        console.log('✅ Tabela criada e funcionando!');
      } else {
        console.log('✅ Tabela criada via RPC:', createResult);
      }

    } catch (rpcError) {
      console.error('❌ Erro ao executar RPC:', rpcError);
      
      // Última tentativa: inserir um registro de teste
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
        return NextResponse.json({
          ok: false,
          error: 'Falha total ao criar/acessar tabela. Erro: ' + testError.message,
          code: testError.code,
          details: testError.details,
          hint: testError.hint
        }, { status: 500 });
      }

      // Limpar teste
      await supabaseAdmin
        .from('whatsapp_instances')
        .delete()
        .eq('id', testInsert.id);

      console.log('✅ Tabela acessível via inserção direta!');
    }

    // Verificação final
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (finalError) {
      return NextResponse.json({
        ok: false,
        error: 'Tabela ainda não está acessível após tentativas: ' + finalError.message
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
