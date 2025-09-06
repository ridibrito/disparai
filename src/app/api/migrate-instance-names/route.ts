import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🔄 Migrando nomes de instâncias para formato específico por organização...');

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

    // Para cada instância, verificar se precisa migrar o nome
    for (const instance of instances || []) {
      console.log(`🔄 Verificando instância: ${instance.instance_key}`);
      
      // Verificar se já está no novo formato (org_{organizationId}_*)
      if (instance.instance_key.startsWith(`org_${instance.organization_id}_`)) {
        console.log(`✅ Instância ${instance.instance_key} já está no formato correto`);
        results.push({
          instance_key: instance.instance_key,
          status: 'already_correct',
          organization_id: instance.organization_id
        });
        continue;
      }

      // Gerar novo nome no formato correto
      const newInstanceKey = `org_${instance.organization_id}_${Date.now()}_migrated`;
      
      console.log(`🔄 Migrando ${instance.instance_key} → ${newInstanceKey}`);

      // IMPORTANTE: Em um ambiente real, você precisaria:
      // 1. Atualizar a instância no MegaAPI com o novo nome
      // 2. Atualizar o webhook URL no MegaAPI
      // 3. Depois atualizar no Supabase

      // Por enquanto, vamos apenas atualizar no Supabase
      // ATENÇÃO: Isso pode quebrar a conexão com o MegaAPI se o nome mudar lá também
      
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          instance_key: newInstanceKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar nome da instância ${instance.instance_key}:`, updateError);
        results.push({
          instance_key: instance.instance_key,
          status: 'error',
          error: updateError.message
        });
      } else {
        // Atualizar também na api_connections se existir
        const { error: connectionUpdateError } = await supabaseAdmin
          .from('api_connections')
          .update({
            instance_id: newInstanceKey,
            updated_at: new Date().toISOString()
          })
          .eq('instance_id', instance.instance_key);

        if (connectionUpdateError) {
          console.error(`⚠️ Erro ao atualizar instance_id na api_connections:`, connectionUpdateError);
        }

        console.log(`✅ Instância migrada: ${instance.instance_key} → ${newInstanceKey}`);
        results.push({
          instance_key: instance.instance_key,
          new_instance_key: newInstanceKey,
          status: 'migrated',
          organization_id: instance.organization_id
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Migração de nomes de instâncias concluída',
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
