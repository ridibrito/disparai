import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { instanceKey } = await req.json();
    
    if (!instanceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Instance key é obrigatório' 
      }, { status: 400 });
    }

    const host = 'https://teste8.megaapi.com.br';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    console.log('🔍 Verificando status da instância:', instanceKey);

    // Verificar autenticação
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar status no MegaAPI
    const statusResponse = await fetch(`${host}/rest/instance/${instanceKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('❌ Erro ao verificar status:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao verificar status: ' + errorText 
      }, { status: statusResponse.status });
    }

    const statusData = await statusResponse.json();
    
    // Mapear status do MegaAPI para nosso status
    let mappedStatus = 'pendente';
    if (statusData.instance?.status === 'connected') {
      mappedStatus = 'ativo';
    } else if (statusData.instance?.status === 'disconnected') {
      mappedStatus = 'desconectado';
    }

    // Atualizar status no Supabase se necessário
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', instanceKey)
      .single();

    if (instance && instance.status !== mappedStatus) {
      console.log('🔄 Atualizando status da instância no Supabase:', instanceKey, mappedStatus);
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          status: mappedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('instance_key', instanceKey);

      if (updateError) {
        console.error('❌ Erro ao atualizar status no Supabase:', updateError);
      } else {
        console.log('✅ Status atualizado no Supabase');
      }
    }

    console.log('✅ Status verificado:', instanceKey, mappedStatus);

    return NextResponse.json({
      success: true,
      instance_key: instanceKey,
      status: mappedStatus,
      megaapi_status: statusData.instance?.status,
      instance_data: statusData,
      updated: instance && instance.status !== mappedStatus
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
