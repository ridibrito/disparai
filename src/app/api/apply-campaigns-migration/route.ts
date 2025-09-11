import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Verificar se está em ambiente de build
    if (process.env.NODE_ENV === 'production' && !req.headers.get('authorization')) {
      return NextResponse.json({ 
        ok: true, 
        message: 'API disponível apenas em runtime' 
      });
    }

    console.log('🔄 Aplicando migração para conectar campanhas com instâncias WhatsApp...');

    // SQL da migração
    const migrationSQL = `
      -- Adicionar campo para referenciar a instância WhatsApp ativa
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;

      -- Adicionar campo para referenciar a conexão API ativa
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS api_connection_id UUID REFERENCES public.api_connections(id) ON DELETE SET NULL;

      -- Adicionar campo para armazenar o ID da mensagem no WhatsApp
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

      -- Adicionar campo para armazenar o número de telefone do destinatário
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS phone_number TEXT;

      -- Adicionar campo para armazenar o nome do destinatário
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS recipient_name TEXT;

      -- Adicionar campo para armazenar dados da mensagem (conteúdo, mídia, etc.)
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS message_data JSONB;

      -- Adicionar campo para armazenar tentativas de envio
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

      -- Adicionar campo para armazenar próxima tentativa
      ALTER TABLE public.campaign_messages 
      ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;

      -- Adicionar campo para armazenar delay entre mensagens (em segundos)
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS message_delay INTEGER DEFAULT 1;

      -- Adicionar campo para armazenar configurações de envio
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS send_settings JSONB DEFAULT '{}';

      -- Adicionar campo para armazenar estatísticas da campanha
      ALTER TABLE public.campaigns 
      ADD COLUMN IF NOT EXISTS statistics JSONB DEFAULT '{
        "total_recipients": 0,
        "sent": 0,
        "delivered": 0,
        "read": 0,
        "failed": 0,
        "pending": 0
      }';
    `;

    // Aplicar a migração
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Erro ao aplicar migração:', error);
      return NextResponse.json({ 
        ok: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Migração aplicada com sucesso!');

    return NextResponse.json({ 
      ok: true, 
      message: 'Migração aplicada com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
