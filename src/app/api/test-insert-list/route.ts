import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Listando instâncias da MegaAPI...');
    
    const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
    
    // Listar instâncias da MegaAPI
    const response = await fetch('https://teste8.megaapi.com.br/rest/instance/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${megaApiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const megaApiResult = await response.json();
    console.log('📡 Resposta da MegaAPI:', megaApiResult);
    console.log('📡 Tipo de megaApiResult.data:', typeof megaApiResult.data);
    console.log('📡 É array?', Array.isArray(megaApiResult.data));
    
    if (megaApiResult.error) {
      console.error('❌ Erro da MegaAPI:', megaApiResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao listar instâncias da MegaAPI',
          details: megaApiResult.message
        },
        { status: 500 }
      );
    }
    
    // Buscar instâncias do banco para complementar dados
    const supabase = createServerClientWithServiceRole();
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (dbError) {
      console.log('⚠️ Erro ao buscar do banco, usando apenas MegaAPI');
    }
    
    // Combinar dados da MegaAPI com dados do banco
    const instances = Array.isArray(megaApiResult.data) 
      ? megaApiResult.data.map((megaInstance: any) => {
          const dbInstance = dbInstances?.find(db => db.instance_key === megaInstance.instance_key);
          return {
            id: dbInstance?.id || `mega-${megaInstance.instance_key}`,
            instance_key: megaInstance.instance_key,
            status: megaInstance.status || 'desconectado',
            webhook_url: dbInstance?.webhook_url || '',
            created_at: dbInstance?.created_at || new Date().toISOString(),
            updated_at: dbInstance?.updated_at || new Date().toISOString(),
            organization_id: dbInstance?.organization_id || '00000000-0000-0000-0000-000000000000',
            token: dbInstance?.token || megaApiToken
          };
        })
      : [];
    
    console.log('✅ Instâncias processadas:', instances.length);
    
    return NextResponse.json({
      success: true,
      instances: instances,
      count: instances.length,
      megaApiData: megaApiResult.data
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao listar instâncias:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando inserção e listagem...');
    
    const supabase = createServerClientWithServiceRole();
    
    // Dados para inserção
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      instance_key: `test_insert_${Date.now()}`,
      token: 'test-token',
      status: 'pendente',
      webhook_url: 'http://localhost:3000/api/webhooks/whatsapp'
    };
    
    console.log('📝 Inserindo dados:', testData);
    
    // Inserir
    const { data: inserted, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir',
        details: insertError.message,
        code: insertError.code
      });
    }
    
    console.log('✅ Dados inseridos:', inserted);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Listar todas as instâncias
    const { data: allInstances, error: listError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (listError) {
      console.error('❌ Erro ao listar:', listError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao listar',
        details: listError.message
      });
    }
    
    console.log('📋 Todas as instâncias:', allInstances);
    
    // Limpar dados de teste
    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', inserted.id);
    
    console.log('🧹 Dados de teste removidos');
    
    return NextResponse.json({
      success: true,
      inserted: inserted,
      allInstances: allInstances,
      count: allInstances?.length || 0,
      note: 'Dados de teste foram removidos'
    });
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
