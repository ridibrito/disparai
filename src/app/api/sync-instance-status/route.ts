import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização de status das instâncias...');
    
    // Buscar todas as instâncias ativas
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'ativo');

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
      return NextResponse.json({ error: 'Erro ao buscar instâncias' }, { status: 500 });
    }

    if (!instances || instances.length === 0) {
      console.log('ℹ️ Nenhuma instância ativa encontrada');
      return NextResponse.json({ message: 'Nenhuma instância ativa encontrada', synced: 0 });
    }

    console.log(`📱 Encontradas ${instances.length} instâncias ativas para sincronizar`);

    let syncedCount = 0;
    const syncResults = [];

    // Verificar status de cada instância no servidor MegaAPI
    for (const instance of instances) {
      try {
        console.log(`🔍 Verificando status da instância: ${instance.instance_key}`);
        
        // Fazer requisição para verificar status no servidor
        const statusResponse = await fetch(
          `${process.env.MEGA_API_HOST}/rest/instance/status/${instance.instance_key}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MEGA_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!statusResponse.ok) {
          console.error(`❌ Erro ao verificar status da instância ${instance.instance_key}:`, statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        const serverStatus = statusData?.instance?.status || 'disconnected';
        
        console.log(`📊 Status no servidor para ${instance.instance_key}: ${serverStatus}`);

        // Mapear status do servidor para nosso sistema
        let mappedStatus = 'desconectado';
        if (serverStatus === 'connected') {
          mappedStatus = 'ativo';
        }

        // Verificar se precisa atualizar
        if (instance.status !== mappedStatus) {
          console.log(`🔄 Atualizando status de ${instance.status} para ${mappedStatus} na instância ${instance.instance_key}`);
          
          // Atualizar status na tabela whatsapp_instances
          const { error: updateError } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: mappedStatus,
              updated_at: new Date().toISOString()
            })
            .eq('instance_key', instance.instance_key);

          if (updateError) {
            console.error(`❌ Erro ao atualizar status da instância ${instance.instance_key}:`, updateError);
            continue;
          }

          // Atualizar status na tabela api_connections
          const { error: connectionUpdateError } = await supabaseAdmin
            .from('api_connections')
            .update({
              status: serverStatus === 'connected' ? 'active' : 'disconnected',
              is_active: serverStatus === 'connected',
              updated_at: new Date().toISOString()
            })
            .eq('instance_id', instance.instance_key);

          if (connectionUpdateError) {
            console.error(`❌ Erro ao atualizar conexão da instância ${instance.instance_key}:`, connectionUpdateError);
          }

          syncedCount++;
          syncResults.push({
            instance_key: instance.instance_key,
            old_status: instance.status,
            new_status: mappedStatus,
            server_status: serverStatus
          });

          console.log(`✅ Status sincronizado para ${instance.instance_key}: ${instance.status} → ${mappedStatus}`);
        } else {
          console.log(`✅ Status já sincronizado para ${instance.instance_key}: ${instance.status}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar instância ${instance.instance_key}:`, error);
      }
    }

    console.log(`🎯 Sincronização concluída: ${syncedCount} instâncias atualizadas`);

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${syncedCount} instâncias atualizadas`,
      synced: syncedCount,
      total: instances.length,
      results: syncResults
    });

  } catch (error) {
    console.error('❌ Erro na sincronização de status:', error);
    return NextResponse.json(
      { error: 'Erro interno na sincronização' },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status sem atualizar
export async function GET() {
  try {
    console.log('🔍 Verificando status das instâncias (somente leitura)...');
    
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'ativo');

    if (instancesError) {
      return NextResponse.json({ error: 'Erro ao buscar instâncias' }, { status: 500 });
    }

    const statusCheck = [];

    for (const instance of instances || []) {
      try {
        const statusResponse = await fetch(
          `${process.env.MEGA_API_HOST}/rest/instance/status/${instance.instance_key}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MEGA_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const serverStatus = statusData?.instance?.status || 'disconnected';
          
          statusCheck.push({
            instance_key: instance.instance_key,
            db_status: instance.status,
            server_status: serverStatus,
            needs_sync: instance.status !== (serverStatus === 'connected' ? 'ativo' : 'desconectado')
          });
        }
      } catch (error) {
        statusCheck.push({
          instance_key: instance.instance_key,
          db_status: instance.status,
          server_status: 'error',
          needs_sync: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      instances: statusCheck,
      needs_sync: statusCheck.filter(i => i.needs_sync).length
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
