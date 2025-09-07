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

    console.log(`🔄 Reiniciando instância: ${instanceKey}`);

    // 1. Reiniciar na MegaAPI
    try {
      const host = process.env.MEGA_API_HOST || 'https://teste8.megaapi.com.br';
      const token = process.env.MEGA_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      // Mapear nomes novos para nomes antigos da MegaAPI
      let megaApiKey = instanceKey;
      if (instanceKey === 'coruss-whatsapp-01') {
        megaApiKey = 'coruss_596274e5';
      } else if (instanceKey === 'coruss-whatsapp-02') {
        megaApiKey = 'coruss_596274e5_575766';
      }

      console.log(`🔄 Reiniciando instância ${megaApiKey} na MegaAPI...`);
      
      const megaApiResponse = await fetch(`${host}/rest/instance/${megaApiKey}/restart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (megaApiResponse.ok) {
        const responseText = await megaApiResponse.text();
        console.log('✅ Instância reiniciada na MegaAPI:', responseText);
        
        // 2. Atualizar status no banco de dados
        const { error: updateError } = await supabaseAdmin
          .from('whatsapp_instances')
          .update({ 
            status: 'ativo',
            updated_at: new Date().toISOString()
          })
          .eq('instance_key', instanceKey);

        if (updateError) {
          console.error('❌ Erro ao atualizar status no Supabase:', updateError);
        } else {
          console.log('✅ Status atualizado no Supabase');
        }

        return NextResponse.json({ 
          ok: true, 
          message: `Instância ${instanceKey} reiniciada com sucesso`,
          instance_key: instanceKey
        });
      } else {
        const errorText = await megaApiResponse.text();
        console.log(`❌ Erro ao reiniciar na MegaAPI: ${megaApiResponse.status} - ${errorText}`);
        return NextResponse.json({ 
          ok: false, 
          error: `Erro ao reiniciar instância: ${errorText}` 
        }, { status: megaApiResponse.status });
      }
    } catch (megaApiError) {
      console.log('⚠️ Erro ao conectar com MegaAPI:', megaApiError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Erro ao conectar com servidor WhatsApp' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro ao reiniciar instância:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
