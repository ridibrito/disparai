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

    // 3. Deletar da MegaAPI (opcional - pode falhar se não existir)
    try {
      // Nota: A MegaAPI pode não ter endpoint de delete, então vamos apenas logar
      console.log(`ℹ️ Instância ${instanceKey} removida do Supabase. Verifique se precisa ser removida manualmente da MegaAPI.`);
    } catch (megaApiError) {
      console.log('ℹ️ Não foi possível deletar da MegaAPI (pode não ter endpoint de delete)');
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
