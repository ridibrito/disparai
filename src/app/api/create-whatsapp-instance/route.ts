import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";
import { MegaAPI } from "@/lib/mega-api";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { instanceName, organizationId } = await req.json();

    // Verificar autenticação
    let user = null;
    try {
      const supabase = await createServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (error) {
      console.log('⚠️ Erro ao verificar autenticação, usando service role:', error);
    }

    if (!user?.id) {
      console.log('⚠️ Usuário não autenticado, usando service role para operação');
      // Se não conseguir autenticar, usar service role com organizationId fornecido
      if (!organizationId) {
        return NextResponse.json({ error: 'OrganizationId é obrigatório quando não há autenticação' }, { status: 400 });
      }
    }

    // Buscar organization_id válido primeiro
    let validOrgId = organizationId;
    let organizationName = 'Default';
    
    if (user?.id && (!validOrgId || validOrgId === 'default-org')) {
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

    // Buscar nome da organização
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('name, company_name')
      .eq('id', validOrgId)
      .single();
    
    if (orgData?.name) {
      organizationName = orgData.name;
    } else if (orgData?.company_name) {
      organizationName = orgData.company_name;
    }

    // Gerar nome único para a instância baseado no nome da organização + número sequencial
    // Formato: {organizationName}-whatsapp-{numero}
    const cleanOrgName = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 12); // Limita a 12 caracteres para deixar espaço para "-whatsapp-XX"

    // Buscar o próximo número sequencial disponível para esta organização
    let instanceNumber = 1;
    let finalInstanceName = instanceName;

    if (!instanceName) {
      // Buscar instâncias existentes desta organização para determinar o próximo número
      const { data: existingInstances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('instance_key')
        .eq('organization_id', validOrgId)
        .like('instance_key', `${cleanOrgName}-whatsapp-%`);
      
      if (existingInstances && existingInstances.length > 0) {
        // Extrair números das instâncias existentes e encontrar o próximo
        const numbers = existingInstances
          .map(inst => {
            const match = inst.instance_key.match(new RegExp(`${cleanOrgName}-whatsapp-(\\d+)$`));
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0);
        
        if (numbers.length > 0) {
          instanceNumber = Math.max(...numbers) + 1;
        }
      }
      
      finalInstanceName = `${cleanOrgName}-whatsapp-${instanceNumber.toString().padStart(2, '0')}`;
    }
    
    // Verificar se a instância já existe no Supabase (usando cliente admin)
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
      return NextResponse.json({ 
        ok: true, 
        instance_key: finalInstanceName,
        data: { message: 'Instância já existe', instance: existingInstance },
        already_exists: true
      });
    }

    // Verificar se a instância já existe no MegaAPI
    const existingMegaApiInstance = await MegaAPI.getInstance(finalInstanceName);

    if (existingMegaApiInstance) {
      // Salvar instância existente no Supabase se não estiver lá
      const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${finalInstanceName}`;
      
      const { data: savedInstance, error: saveError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert({
          organization_id: validOrgId,
          instance_key: finalInstanceName,
          token: process.env.MEGA_API_TOKEN,
          status: 'ativo', // Sempre ativa para aparecer no frontend
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
      }

      // Verificar se precisa criar conexão na api_connections
      const { data: existingConnection } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('instance_id', finalInstanceName)
        .single();

      if (!existingConnection) {
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
            api_key: process.env.MEGA_API_TOKEN,
            api_secret: process.env.MEGA_API_TOKEN,
            status: existingMegaApiInstance.status === 'connected' ? 'active' : 'pending',
            is_active: existingMegaApiInstance.status === 'connected',
            provider: 'disparai'
          };

          const { data: savedConnection, error: connectionError } = await supabaseAdmin
            .from('api_connections')
            .insert(connectionData as any)
            .select()
            .single();

          if (connectionError) {
            console.error('❌ Erro ao criar api_connection para instância existente:', connectionError);
          } else {
            console.log('✅ API Connection criada para instância existente:', savedConnection);
          }
        }
      }

      return NextResponse.json({ 
        ok: true, 
        instance_key: finalInstanceName,
        data: existingMegaApiInstance,
        already_exists: true,
        instance: savedInstance,
        organization_name: organizationName,
        organization_id: validOrgId,
        instance_name: finalInstanceName
      });
    }

    // Criar nova instância no MegaAPI
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${finalInstanceName}`;
    const newMegaApiInstance = await MegaAPI.createInstance(finalInstanceName, webhookUrl);

    // Usar o instanceName se instance_key não estiver disponível
    const finalInstanceKey = newMegaApiInstance.instance_key || finalInstanceName;
    
    // Salvar instância no Supabase como ATIVA (para aparecer no frontend)
    const { data: savedInstance, error: saveError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        organization_id: validOrgId,
        instance_key: finalInstanceKey,
        token: process.env.MEGA_API_TOKEN,
        status: 'ativo', // Ativa para aparecer no frontend
        webhook_url: webhookUrl
      } as any)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Erro ao salvar instância no Supabase:', saveError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Instância criada no MegaAPI mas erro ao salvar no banco: ' + saveError.message,
        details: saveError
      }, { status: 500 });
    }

    // Criar conexão na api_connections imediatamente
    const { data: userForNewConnection } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('organization_id', validOrgId)
      .single();

    if (userForNewConnection) {
      const connectionData = {
        user_id: userForNewConnection.id,
        organization_id: validOrgId,
        name: `WhatsApp Disparai - ${finalInstanceKey}`,
        type: 'whatsapp_disparai',
        instance_id: finalInstanceKey,
        api_key: process.env.MEGA_API_TOKEN,
        api_secret: process.env.MEGA_API_TOKEN,
        status: 'pending', // Pendente até conectar via QR code
        is_active: false, // Fica ativo após conectar
        provider: 'disparai'
      };

      const { data: savedConnection, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .insert(connectionData as any)
        .select()
        .single();

      if (connectionError) {
        console.error('❌ Erro ao criar api_connection:', connectionError);
        // Não falha a operação, apenas loga o erro
      } else {
        console.log('✅ API Connection criada:', savedConnection);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      instance_key: finalInstanceKey, 
      data: newMegaApiInstance,
      instance: savedInstance,
      organization_name: organizationName,
      organization_id: validOrgId,
      instance_name: finalInstanceName,
      already_exists: false
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}