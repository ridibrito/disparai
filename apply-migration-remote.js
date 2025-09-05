// Script para aplicar migração no banco de dados remoto
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://doriuzvietifszgipexy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcml1enZpZXRpZnN6Z2lwZXh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYzNTY5OSwiZXhwIjoyMDcyMjExNjk5fQ.1g0qWPh-QGetH6dhA5D4bTZJjJ582mca0L60GZWrpKY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migração para adicionar campos à tabela api_connections...');

    // SQL para adicionar os campos
    const migrationSQL = `
      -- Adicionar campo name para identificar a conexão
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS name TEXT;

      -- Adicionar campo instance_id para armazenar a chave da instância
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS instance_id TEXT;

      -- Adicionar campo is_active para controlar se a conexão está ativa
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

      -- Adicionar campo status para controlar o status da conexão
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

      -- Adicionar campo description para descrição da conexão
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS description TEXT;

      -- Adicionar campo webhook_url para URL do webhook
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS webhook_url TEXT;

      -- Adicionar campo phone_number_id para ID do número de telefone
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

      -- Adicionar campo provider para identificar o provedor (disparai, evolution, etc.)
      ALTER TABLE public.api_connections 
      ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'disparai';

      -- Adicionar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_api_connections_instance_id ON public.api_connections(instance_id);
      CREATE INDEX IF NOT EXISTS idx_api_connections_status ON public.api_connections(status);
      CREATE INDEX IF NOT EXISTS idx_api_connections_is_active ON public.api_connections(is_active);
      CREATE INDEX IF NOT EXISTS idx_api_connections_provider ON public.api_connections(provider);

      -- Atualizar registros existentes para ter valores padrão
      UPDATE public.api_connections 
      SET 
        name = COALESCE(name, 'Conexão WhatsApp'),
        status = COALESCE(status, 'pending'),
        is_active = COALESCE(is_active, false),
        provider = COALESCE(provider, 'disparai')
      WHERE name IS NULL OR status IS NULL OR is_active IS NULL OR provider IS NULL;
    `;

    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Erro ao aplicar migração:', error);
      return;
    }

    console.log('✅ Migração aplicada com sucesso!');
    console.log('📊 Dados retornados:', data);

    // Verificar se os campos foram adicionados
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'api_connections')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
      return;
    }

    console.log('📋 Estrutura da tabela api_connections:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a migração
applyMigration();
