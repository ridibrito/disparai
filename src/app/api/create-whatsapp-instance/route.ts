import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { instanceName, organizationId } = await req.json();
    const host = 'https://teste8.megaapi.com.br';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    console.log('🚀 Criando instância:', { instanceName, organizationId, host });

    // Verificar autenticação
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar organization_id válido primeiro
    let validOrgId = organizationId;
    if (!validOrgId || validOrgId === 'default-org') {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      validOrgId = userData?.organization_id;
    }
    
    // Se ainda não tiver, usar uma organização padrão
    if (!validOrgId) {
      const { data: defaultOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      validOrgId = defaultOrg?.id || '596274e5-69c9-4267-975d-18f6af63c9b2';
    }

    // Gerar nome único para a instância se não fornecido
    // Formato: org_{organizationId}_{timestamp}
    const finalInstanceName = instanceName || `org_${validOrgId}_${Date.now()}`;
    
    // Verificar se a instância já existe no Supabase (usando cliente admin)
    console.log('🔍 Verificando instância existente no Supabase:', finalInstanceName);
    const { data: existingInstance, error: checkError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', finalInstanceName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar instância existente:', checkError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Erro ao verificar instância existente: ' + checkError.message 
      }, { status: 500 });
    }

    if (existingInstance) {
      console.log('⚠️ Instância já existe no Supabase:', existingInstance);
      return NextResponse.json({ 
        ok: true, 
        instance_key: finalInstanceName,
        data: { message: 'Instância já existe', instance: existingInstance },
        already_exists: true
      });
    }

    // Verificar se a instância já existe no MegaAPI
    console.log('🔍 Verificando se instância existe no MegaAPI...');
    const checkResponse = await fetch(`${host}/rest/instance/${finalInstanceName}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      }
    });

    if (checkResponse.ok) {
      console.log('⚠️ Instância já existe no MegaAPI');
      const existingData = await checkResponse.json();
      
      // Salvar instância existente no Supabase se não estiver lá
      if (!existingInstance) {
        const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${validOrgId}`;
        
        console.log('💾 Salvando instância existente no Supabase...');
        
        const { data: savedInstance, error: saveError } = await supabaseAdmin
          .from('whatsapp_instances')
          .insert({
            organization_id: validOrgId,
            instance_key: finalInstanceName,
            token: token,
            status: existingData.instance?.status === 'connected' ? 'ativo' : 'pendente',
            webhook_url: webhookUrl
          } as any)
          .select()
          .single();

        if (saveError) {
          console.error('❌ Erro ao salvar instância existente no Supabase:', saveError);
          return NextResponse.json({ 
            ok: false, 
            error: 'Erro ao salvar instância existente: ' + saveError.message 
          }, { status: 500 });
        } else {
          console.log('✅ Instância existente salva no Supabase:', savedInstance);
        }
      }

      // Verificar se precisa criar conexão na api_connections
      const { data: existingConnection } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('instance_id', finalInstanceName)
        .single();

      if (!existingConnection) {
        console.log('🔗 Criando conexão para instância existente...');
        const { data: userForConnection } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('organization_id', organizationId || '596274e5-69c9-4267-975d-18f6af63c9b2')
          .single();

        if (userForConnection) {
          const connectionData = {
            user_id: userForConnection.id,
            organization_id: organizationId || '596274e5-69c9-4267-975d-18f6af63c9b2',
            name: `WhatsApp Disparai - ${finalInstanceName}`,
            type: 'whatsapp_disparai',
            instance_id: finalInstanceName,
            api_key: token,
            api_secret: token,
            status: existingData.instance?.status === 'connected' ? 'active' : 'pending',
            is_active: existingData.instance?.status === 'connected',
            provider: 'disparai'
          };

          const { data: newConnection, error: connectionError } = await supabaseAdmin
            .from('api_connections')
            .insert(connectionData as any)
            .select()
            .single();

          if (connectionError) {
            console.error('⚠️ Erro ao criar conexão para instância existente:', connectionError);
          } else {
            console.log('✅ Conexão criada para instância existente:', newConnection);
          }
        }
      }

      return NextResponse.json({ 
        ok: true, 
        instance_key: finalInstanceName,
        data: existingData,
        already_exists: true,
        instance: existingInstance
      });
    }

    // Criar nova instância no MegaAPI
    console.log('🆕 Criando nova instância no MegaAPI...');
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${validOrgId}`;
    
    const createResponse = await fetch(`${host}/rest/instance/init?instance_key=${finalInstanceName}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        messageData: {
          webhookUrl: webhookUrl,
          webhookEnabled: true
        }
      })
    });

    console.log('📡 Resposta MegaAPI:', { status: createResponse.status, statusText: createResponse.statusText });

    if (!createResponse.ok) {
      const err = await createResponse.text();
      console.error('❌ Erro ao criar instância no MegaAPI:', err);
      return NextResponse.json({ ok: false, error: err }, { status: createResponse.status });
    }

    const createData = await createResponse.json();
    const instance_key = createData.instanceKey ?? finalInstanceName;

    console.log('✅ Instância criada no MegaAPI:', { instance_key, createData });

    // Salvar instância no Supabase
    console.log('💾 Salvando nova instância no Supabase...');
    
    const { data: savedInstance, error: saveError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        organization_id: validOrgId,
        instance_key: instance_key,
        token: token,
        status: 'pendente',
        webhook_url: webhookUrl
      } as any)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Erro ao salvar instância no Supabase:', saveError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Instância criada no MegaAPI mas erro ao salvar no banco: ' + saveError.message 
      }, { status: 500 });
    }

    console.log('✅ Instância salva no Supabase:', savedInstance);

    // Criar conexão na api_connections imediatamente
    console.log('🔗 Criando conexão na api_connections...');
    const { data: userForNewConnection } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('organization_id', validOrgId)
      .single();

    if (userForNewConnection) {
      const connectionData = {
        user_id: userForNewConnection.id,
        organization_id: validOrgId,
        name: `WhatsApp Disparai - ${instance_key}`,
        type: 'whatsapp_disparai',
        instance_id: instance_key,
        api_key: token,
        api_secret: token,
        status: 'pending', // Inicialmente pendente, será atualizado quando conectar
        is_active: false, // Inicialmente inativo
        provider: 'disparai'
      };

      const { data: newConnection, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .insert(connectionData as any)
        .select()
        .single();

      if (connectionError) {
        console.error('⚠️ Erro ao criar conexão na api_connections:', connectionError);
        // Não falhar a criação da instância por causa disso
      } else {
        console.log('✅ Conexão criada na api_connections:', newConnection);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      instance_key, 
      data: createData,
      instance: savedInstance,
      already_exists: false
    });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}