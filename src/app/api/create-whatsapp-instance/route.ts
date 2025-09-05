import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { instanceName } = await req.json();
    const host = 'https://teste8.megaapi.com.br';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    console.log('🚀 Criando instância:', { instanceName, host });

    // Criar instância no MegaAPI
    const r = await fetch(`${host}/rest/instance/init?instance_key=${instanceName}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        messageData: {
          webhookUrl: "",
          webhookEnabled: true
        }
      })
    });

    console.log('📡 Resposta MegaAPI:', { status: r.status, statusText: r.statusText });

    if (!r.ok) {
      const err = await r.text();
      console.error('❌ Erro ao criar instância no MegaAPI:', err);
      return NextResponse.json({ ok: false, error: err }, { status: r.status });
    }

    const data = await r.json();
    const instance_key = data.instanceKey ?? instanceName;

    console.log('✅ Instância criada no MegaAPI:', { instance_key, data });

    return NextResponse.json({ ok: true, instance_key, data });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}