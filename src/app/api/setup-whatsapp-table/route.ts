import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    console.log('🔧 Configurando tabela whatsapp_instances...');

    // SQL para criar a tabela
    const createTableSQL = `
      -- Criar tabela simplificada para gerenciar instâncias WhatsApp
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

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_key ON whatsapp_instances(instance_key);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

      -- Dropar política existente se houver
      DROP POLICY IF EXISTS "Allow all operations for testing" ON whatsapp_instances;

      -- Política simples para permitir todas as operações (temporária para teste)
      CREATE POLICY "Allow all operations for testing" ON whatsapp_instances
        FOR ALL USING (true) WITH CHECK (true);

      -- Função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Dropar trigger existente se houver
      DROP TRIGGER IF EXISTS update_whatsapp_instances_updated_at ON whatsapp_instances;

      -- Trigger para atualizar updated_at automaticamente
      CREATE TRIGGER update_whatsapp_instances_updated_at 
        BEFORE UPDATE ON whatsapp_instances 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;

    // Executar SQL
    const { error: execError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (execError) {
      console.error('❌ Erro ao executar SQL:', execError);
      return NextResponse.json({
        ok: false,
        error: execError.message,
        code: execError.code
      }, { status: 500 });
    }

    // Verificar se a tabela foi criada
    const { data: testQuery, error: testError } = await supabase
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError);
      return NextResponse.json({
        ok: false,
        error: 'Tabela criada mas com erro ao acessar: ' + testError.message
      }, { status: 500 });
    }

    console.log('✅ Tabela whatsapp_instances configurada com sucesso!');

    return NextResponse.json({
      ok: true,
      message: 'Tabela whatsapp_instances configurada com sucesso!',
      testQuery: testQuery
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
