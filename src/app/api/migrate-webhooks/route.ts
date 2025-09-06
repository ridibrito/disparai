import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🔄 Migrando webhooks para formato específico por organização...');

    // Buscar todas as instâncias existentes
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*');

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
      return NextResponse.json({
        ok: false,
        error: instancesError.message
      }, { status: 500 });
    }

    console.log(`📱 Encontradas ${instances?.length || 0} instâncias para migrar`);

    const results = [];

    // Para cada instância, atualizar o webhook URL
    for (const instance of instances || []) {
      console.log(`🔄 Migrando instância: ${instance.instance_key}`);
      
      const newWebhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${instance.organization_id}`;
      
      // Atualizar webhook URL na tabela
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          webhook_url: newWebhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar webhook para ${instance.instance_key}:`, updateError);
        results.push({
          instance_key: instance.instance_key,
          status: 'error',
          error: updateError.message
        });
      } else {
        console.log(`✅ Webhook atualizado para ${instance.instance_key}: ${newWebhookUrl}`);
        results.push({
          instance_key: instance.instance_key,
          status: 'updated',
          old_webhook: instance.webhook_url,
          new_webhook: newWebhookUrl
        });
      }

      // TODO: Atualizar webhook no MegaAPI também (se necessário)
      // Isso requer uma chamada para a API do MegaAPI para atualizar a configuração do webhook
    }

    return NextResponse.json({
      ok: true,
      message: 'Migração de webhooks concluída',
      instances_processed: instances?.length || 0,
      results: results
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
