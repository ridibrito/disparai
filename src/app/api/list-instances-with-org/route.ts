import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Verificar autenticação
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('📋 Listando instâncias com informações da organização...');

    // Buscar instâncias com informações da organização
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select(`
        *,
        organizations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
      return NextResponse.json({
        ok: false,
        error: instancesError.message,
        instances: []
      }, { status: 500 });
    }

    // Buscar também as conexões
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('type', 'whatsapp_disparai')
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('❌ Erro ao buscar conexões:', connectionsError);
    }

    // Combinar dados das instâncias com as conexões
    const instancesWithConnections = instances?.map(instance => {
      const connection = connections?.find(conn => conn.instance_id === instance.instance_key);
      return {
        ...instance,
        connection: connection || null,
        organization_name: instance.organizations?.name || 'Organização não encontrada'
      };
    }) || [];

    console.log(`✅ Instâncias encontradas: ${instancesWithConnections.length}`);

    return NextResponse.json({
      ok: true,
      instances: instancesWithConnections,
      instancesCount: instancesWithConnections.length,
      message: `Encontradas ${instancesWithConnections.length} instâncias`
    });

  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      instances: []
    }, { status: 500 });
  }
}
