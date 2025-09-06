import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log('🔄 Sincronizando instâncias WhatsApp com api_connections...');

    // 1. Buscar todas as instâncias WhatsApp conectadas
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'ativo');

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
      return NextResponse.json({
        ok: false,
        error: instancesError.message
      }, { status: 500 });
    }

    console.log('📱 Instâncias conectadas encontradas:', instances?.length || 0);

    const results = [];

    // 2. Para cada instância conectada, verificar se existe na api_connections
    for (const instance of instances || []) {
      console.log(`🔍 Verificando instância: ${instance.instance_key}`);

      // Verificar se já existe na api_connections
      const { data: existingConnection } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('instance_id', instance.instance_key)
        .single();

      if (existingConnection) {
        console.log(`✅ Conexão já existe para ${instance.instance_key}`);
        results.push({
          instance_id: instance.instance_key,
          status: 'already_exists',
          connection: existingConnection
        });
        continue;
      }

      // Buscar user_id da organização
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('organization_id', instance.organization_id)
        .single();

      if (!user) {
        console.log(`⚠️ Usuário não encontrado para organização ${instance.organization_id}`);
        results.push({
          instance_id: instance.instance_key,
          status: 'user_not_found',
          organization_id: instance.organization_id
        });
        continue;
      }

      // Criar conexão na api_connections
      const connectionData = {
        user_id: user.id,
        organization_id: instance.organization_id,
        name: `WhatsApp Disparai - ${instance.instance_key}`,
        type: 'whatsapp_disparai',
        instance_id: instance.instance_key,
        api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
        api_secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
        status: 'active',
        is_active: true,
        provider: 'disparai'
      };

      const { data: newConnection, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .insert(connectionData as any)
        .select()
        .single();

      if (connectionError) {
        console.error(`❌ Erro ao criar conexão para ${instance.instance_key}:`, connectionError);
        results.push({
          instance_id: instance.instance_key,
          status: 'error',
          error: connectionError.message
        });
      } else {
        console.log(`✅ Conexão criada para ${instance.instance_key}`);
        results.push({
          instance_id: instance.instance_key,
          status: 'created',
          connection: newConnection
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Sincronização concluída',
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
