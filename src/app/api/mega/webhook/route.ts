import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const instanceKey = body.instanceKey ?? body.instance_key ?? body.instance ?? "";

    if (!instanceKey) {
      console.log('⚠️ Webhook recebido sem instanceKey');
      return NextResponse.json({ ok: true, message: "Webhook recebido sem instanceKey" });
    }

    console.log('📨 Webhook recebido:', { instanceKey, body });

    // Re-verificar status na MegaAPI
    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    const r = await fetch(`${host}/rest/instance/${instanceKey}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!r.ok) {
      console.error('❌ Erro ao verificar status no webhook:', r.status);
      return NextResponse.json({ ok: false, error: "Erro ao verificar status" }, { status: r.status });
    }

    const statusData = await r.json();
    const connected = !!(statusData?.user || statusData?.connected === true);

    console.log('🔍 Status verificado:', { instanceKey, connected, statusData });

    // Atualizar whatsapp_instances
    const { error: instanceError } = await supabase
      .from("whatsapp_instances")
      .update({ 
        status: connected ? "connected" : "disconnected", 
        updated_at: new Date().toISOString() 
      })
      .eq("instance_key", instanceKey);

    if (instanceError) {
      console.error('❌ Erro ao atualizar whatsapp_instances:', instanceError);
    }

    // Atualizar api_connections
    const { error: connectionError } = await supabase
      .from("api_connections")
      .upsert({
        instance_key: instanceKey,
        connected,
        meta: body,
        updated_at: new Date().toISOString()
      }, { onConflict: "instance_key" });

    if (connectionError) {
      console.error('❌ Erro ao atualizar api_connections:', connectionError);
    }

    console.log('✅ Webhook processado com sucesso:', { instanceKey, connected });

    return NextResponse.json({ ok: true, connected });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
