import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";
import { MegaAPI } from "@/lib/mega-api";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: Request) {
  try {
    const { instanceKey } = await req.json();

    if (!instanceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: 'instanceKey é obrigatório' 
      }, { status: 400 });
    }

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
    }

    console.log(`🗑️ Deletando instância: ${instanceKey}`);

    // 1. Deletar da tabela whatsapp_instances
    const { error: instanceDeleteError } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('instance_key', instanceKey);

    if (instanceDeleteError) {
      console.error('❌ Erro ao deletar instância do Supabase:', instanceDeleteError);
    } else {
      console.log('✅ Instância deletada do Supabase');
    }

    // 2. Deletar da tabela api_connections
    const { error: connectionDeleteError } = await supabaseAdmin
      .from('api_connections')
      .delete()
      .eq('instance_id', instanceKey);

    if (connectionDeleteError) {
      console.error('❌ Erro ao deletar conexão do Supabase:', connectionDeleteError);
    } else {
      console.log('✅ Conexão deletada do Supabase');
    }

    // 3. Primeiro desconectar (logout) e depois deletar da MegaAPI
    try {
      const host = process.env.MEGA_API_HOST || 'https://teste8.megaapi.com.br';
      const token = process.env.MEGA_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      // Usar o nome exato da instância
      let megaApiKey = instanceKey;
      
      console.log(`🔑 Mapeamento de chave: ${instanceKey} -> ${megaApiKey}`);
      console.log(`🌐 Host: ${host}`);
      console.log(`🔐 Token: ${token.substring(0, 20)}...`);

      // Passo 1: Fazer logout primeiro (desconectar WhatsApp)
      console.log(`🔌 Desconectando instância ${megaApiKey} da MegaAPI...`);
      const logoutResponse = await fetch(`${host}/rest/instance/${megaApiKey}/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Status do logout: ${logoutResponse.status}`);
      if (logoutResponse.ok) {
        const logoutText = await logoutResponse.text();
        console.log('✅ Instância desconectada da MegaAPI:', logoutText);
      } else {
        const logoutError = await logoutResponse.text();
        console.log(`⚠️ Erro no logout (continuando com delete): ${logoutResponse.status} - ${logoutError}`);
      }

      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Passo 2: Deletar a instância completamente
      console.log(`🗑️ Deletando instância ${megaApiKey} da MegaAPI...`);
      console.log(`🔗 URL: ${host}/rest/instance/${megaApiKey}/delete`);
      
      const megaApiResponse = await fetch(`${host}/rest/instance/${megaApiKey}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Status da resposta MegaAPI: ${megaApiResponse.status}`);
      console.log(`📡 Headers da resposta:`, Object.fromEntries(megaApiResponse.headers.entries()));

      if (megaApiResponse.ok) {
        const responseText = await megaApiResponse.text();
        console.log('✅ Instância deletada da MegaAPI:', responseText);
      } else {
        const errorText = await megaApiResponse.text();
        console.log(`❌ Erro ao deletar da MegaAPI: ${megaApiResponse.status} - ${errorText}`);
        console.log(`❌ URL que falhou: ${host}/rest/instance/${megaApiKey}/delete`);
      }
    } catch (megaApiError) {
      console.log('⚠️ Erro ao conectar com MegaAPI:', megaApiError);
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Instância ${instanceKey} deletada com sucesso`,
      instance_key: instanceKey
    });

  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
