import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { instanceKey } = await req.json();
    
    console.log(`🔄 Migrando instância ${instanceKey} para formato multi-tenant...`);

    if (!instanceKey) {
      return NextResponse.json({
        ok: false,
        error: 'instanceKey é obrigatório'
      }, { status: 400 });
    }

    // Buscar a instância existente
    const { data: existingInstance, error: fetchError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', instanceKey)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar instância:', fetchError);
      return NextResponse.json({
        ok: false,
        error: 'Instância não encontrada'
      }, { status: 404 });
    }

    console.log('📋 Instância encontrada:', existingInstance);

    // Gerar novo nome multi-tenant
    const organizationId = existingInstance.organization_id;
    const newInstanceKey = `org_${organizationId}_${Date.now()}`;
    const newWebhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${organizationId}`;

    console.log('🆕 Novo formato:', {
      newInstanceKey,
      newWebhookUrl
    });

    // Atualizar a instância no Supabase
    const { data: updatedInstance, error: updateError } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({
        instance_key: newInstanceKey,
        webhook_url: newWebhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingInstance.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar instância:', updateError);
      return NextResponse.json({
        ok: false,
        error: 'Erro ao atualizar instância: ' + updateError.message
      }, { status: 500 });
    }

    // Atualizar a conexão na api_connections se existir
    const { data: existingConnection } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('instance_id', instanceKey)
      .single();

    if (existingConnection) {
      console.log('🔗 Atualizando conexão na api_connections...');
      
      const { data: updatedConnection, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .update({
          instance_id: newInstanceKey,
          name: `WhatsApp Disparai - ${newInstanceKey}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (connectionError) {
        console.error('⚠️ Erro ao atualizar conexão:', connectionError);
      } else {
        console.log('✅ Conexão atualizada:', updatedConnection);
      }
    }

    console.log('✅ Migração concluída:', updatedInstance);

    return NextResponse.json({
      ok: true,
      message: 'Instância migrada com sucesso',
      oldInstanceKey: instanceKey,
      newInstanceKey: newInstanceKey,
      instance: updatedInstance
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
