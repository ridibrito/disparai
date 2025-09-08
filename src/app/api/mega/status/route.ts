import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instanceKey = searchParams.get("instanceKey");
    
    if (!instanceKey) {
      return NextResponse.json({ ok: false, error: "instanceKey é obrigatório" }, { status: 400 });
    }

    const host = process.env.MEGA_API_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    // Primeiro, listar todas as instâncias para encontrar a correta
    const listResponse = await fetch(`${host}/rest/instance/list`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!listResponse.ok) {
      return NextResponse.json({ ok: false, error: "Erro ao listar instâncias" }, { status: listResponse.status });
    }

    const listData = await listResponse.json();
    
    // Procurar a instância específica na lista
    const targetInstance = listData.instances?.find((inst: any) => {
      // Usar o nome exato da instância
      return inst.key === instanceKey;
    });

    if (!targetInstance) {
      return NextResponse.json({ 
        ok: false, 
        error: "Instância não encontrada",
        data: { instance: null }
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: { instance: targetInstance }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
