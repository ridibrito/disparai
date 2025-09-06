import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Verificando instâncias WhatsApp...');

    // Buscar todas as instâncias (sem filtro de status)
    const { data: allInstances, error: allError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as instâncias:', allError);
      return NextResponse.json({
        ok: false,
        error: allError.message
      }, { status: 500 });
    }

    // Buscar apenas instâncias ativas
    const { data: activeInstances, error: activeError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'ativo');

    if (activeError) {
      console.error('❌ Erro ao buscar instâncias ativas:', activeError);
    }

    // Buscar instâncias pendentes
    const { data: pendingInstances, error: pendingError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'pendente');

    if (pendingError) {
      console.error('❌ Erro ao buscar instâncias pendentes:', pendingError);
    }

    console.log('📊 Estatísticas:');
    console.log(`- Total de instâncias: ${allInstances?.length || 0}`);
    console.log(`- Instâncias ativas: ${activeInstances?.length || 0}`);
    console.log(`- Instâncias pendentes: ${pendingInstances?.length || 0}`);

    return NextResponse.json({
      ok: true,
      stats: {
        total: allInstances?.length || 0,
        active: activeInstances?.length || 0,
        pending: pendingInstances?.length || 0
      },
      allInstances: allInstances || [],
      activeInstances: activeInstances || [],
      pendingInstances: pendingInstances || []
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
