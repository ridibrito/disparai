import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug: Testando criação de instância...');
    
    const { organizationId } = await request.json();
    console.log('📦 OrganizationId recebido:', organizationId);
    
    // 1. Testar conexão com Supabase
    const supabase = createServerClientWithServiceRole();
    console.log('✅ Supabase conectado');
    
    // 2. Verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('whatsapp_instances')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Tabela não existe ou não é acessível',
        details: tableError.message
      });
    }
    
    console.log('✅ Tabela acessível');
    
    // 3. Preparar dados para inserção
    const instanceKey = `debug_${Date.now()}`;
    const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
    const webhookUrl = `${request.nextUrl.origin}/api/webhooks/whatsapp`;
    
    // Se organizationId não for um UUID válido, usar um UUID padrão
    let orgId = organizationId;
    if (!organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      orgId = '00000000-0000-0000-0000-000000000000'; // UUID padrão
      console.log('⚠️ OrganizationId não é UUID válido, usando UUID padrão');
    }
    
    const insertData = {
      organization_id: orgId,
      instance_key: instanceKey,
      token: megaApiToken,
      status: 'pendente',
      webhook_url: webhookUrl
    };
    
    console.log('📝 Dados para inserção:', insertData);
    
    // 4. Tentar inserir
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir instância',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        insertData: insertData
      });
    }
    
    console.log('✅ Instância inserida com sucesso:', instance);
    
    // 5. Verificar se foi realmente salva
    const { data: verifyData, error: verifyError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instance.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar instância:', verifyError);
    } else {
      console.log('✅ Instância verificada no banco:', verifyData);
    }
    
    // 6. Limpar dados de teste
    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instance.id);
    
    console.log('🧹 Dados de teste removidos');
    
    return NextResponse.json({
      success: true,
      message: 'Debug completo realizado com sucesso!',
      steps: {
        supabaseConnection: 'OK',
        tableAccess: 'OK',
        dataPreparation: 'OK',
        insertion: 'OK',
        verification: verifyError ? 'ERRO' : 'OK',
        cleanup: 'OK'
      },
      insertedData: instance,
      verifiedData: verifyData,
      note: 'Dados de teste foram removidos'
    });
    
  } catch (error: any) {
    console.error('❌ Erro no debug:', error);
    
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
