/**
 * Script para testar a exclusão completa de conexões
 * Testa: Mega API + whatsapp_instances + api_connections
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MEGA_HOST = 'https://teste8.megaapi.com.br';
const MEGA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDeleteConnection() {
  console.log('🧪 Testando exclusão completa de conexões...\n');

  try {
    // 1. Listar conexões existentes
    console.log('📋 1. Listando conexões existentes...');
    const { data: connections, error: connectionsError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('type', 'whatsapp_disparai')
      .limit(1);

    if (connectionsError) {
      console.error('❌ Erro ao buscar conexões:', connectionsError);
      return;
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ Nenhuma conexão Disparai encontrada para teste');
      return;
    }

    const testConnection = connections[0];
    console.log('✅ Conexão encontrada:', {
      id: testConnection.id,
      name: testConnection.name,
      instance_id: testConnection.instance_id,
      type: testConnection.type
    });

    // 2. Verificar se instância existe no Mega API
    console.log('\n🌐 2. Verificando instância no Mega API...');
    try {
      const megaResponse = await fetch(`${MEGA_HOST}/rest/instance/${testConnection.instance_id}`, {
        headers: {
          'Authorization': `Bearer ${MEGA_TOKEN}`
        }
      });

      if (megaResponse.ok) {
        const megaData = await megaResponse.json();
        console.log('✅ Instância existe no Mega API:', {
          status: megaData.instance?.status,
          name: megaData.instance?.instanceName
        });
      } else {
        console.log('⚠️ Instância não encontrada no Mega API');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar Mega API:', error.message);
    }

    // 3. Verificar se existe na tabela whatsapp_instances
    console.log('\n🗄️ 3. Verificando tabela whatsapp_instances...');
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', testConnection.instance_id);

    if (instancesError) {
      console.log('⚠️ Erro ao verificar whatsapp_instances:', instancesError.message);
    } else if (instances && instances.length > 0) {
      console.log('✅ Encontrado na tabela whatsapp_instances:', instances.length, 'registros');
    } else {
      console.log('ℹ️ Não encontrado na tabela whatsapp_instances');
    }

    // 4. Testar exclusão via API
    console.log('\n🗑️ 4. Testando exclusão via API...');
    const deleteResponse = await fetch(`http://localhost:3000/api/connections?id=${testConnection.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log('✅ Exclusão via API bem-sucedida:', deleteResult.message);
    } else {
      const deleteError = await deleteResponse.json();
      console.error('❌ Erro na exclusão via API:', deleteError.error);
      return;
    }

    // 5. Verificar se foi removido da api_connections
    console.log('\n🔍 5. Verificando remoção da api_connections...');
    const { data: remainingConnections, error: remainingError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('id', testConnection.id);

    if (remainingError) {
      console.error('❌ Erro ao verificar api_connections:', remainingError);
    } else if (!remainingConnections || remainingConnections.length === 0) {
      console.log('✅ Removido da tabela api_connections');
    } else {
      console.log('❌ Ainda existe na tabela api_connections');
    }

    // 6. Verificar se foi removido da whatsapp_instances
    console.log('\n🔍 6. Verificando remoção da whatsapp_instances...');
    const { data: remainingInstances, error: remainingInstancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', testConnection.instance_id);

    if (remainingInstancesError) {
      console.log('⚠️ Erro ao verificar whatsapp_instances:', remainingInstancesError.message);
    } else if (!remainingInstances || remainingInstances.length === 0) {
      console.log('✅ Removido da tabela whatsapp_instances');
    } else {
      console.log('❌ Ainda existe na tabela whatsapp_instances');
    }

    // 7. Verificar se foi removido do Mega API
    console.log('\n🔍 7. Verificando remoção do Mega API...');
    try {
      const megaCheckResponse = await fetch(`${MEGA_HOST}/rest/instance/${testConnection.instance_id}`, {
        headers: {
          'Authorization': `Bearer ${MEGA_TOKEN}`
        }
      });

      if (megaCheckResponse.status === 404) {
        console.log('✅ Removido do Mega API (404)');
      } else if (megaCheckResponse.ok) {
        console.log('⚠️ Ainda existe no Mega API');
      } else {
        console.log('⚠️ Status inesperado do Mega API:', megaCheckResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar Mega API:', error.message);
    }

    console.log('\n🎉 Teste de exclusão concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testDeleteConnection();
