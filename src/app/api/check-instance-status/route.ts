import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { MegaAPI } from "@/lib/mega-api";

export async function POST(req: Request) {
  try {
    const { instanceKey } = await req.json();
    
    if (!instanceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Instance key é obrigatório' 
      }, { status: 400 });
    }

    // Verificar autenticação
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar status no MegaAPI
    const statusData = await MegaAPI.getInstance(instanceKey);
    
    if (!statusData) {
        return NextResponse.json({ 
        success: false, 
        error: 'Instância não encontrada no MegaAPI' 
      }, { status: 404 });
    }

    // Mapear status do MegaAPI para nosso status
    let mappedStatus = 'pendente';
    if (statusData.status === 'connected') {
      mappedStatus = 'ativo';
    } else if (statusData.status === 'disconnected') {
      mappedStatus = 'desconectado';
    }

    // Atualizar status no Supabase se necessário
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', instanceKey)
      .single();

    if (instance && instance.status !== mappedStatus) {
      await supabase
        .from('whatsapp_instances')
        .update({ 
          status: mappedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('instance_key', instanceKey);
    }

    return NextResponse.json({
      success: true,
      instance_key: instanceKey,
      status: mappedStatus,
      megaapi_status: statusData.status,
      instance_data: statusData,
      updated: instance && instance.status !== mappedStatus
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
