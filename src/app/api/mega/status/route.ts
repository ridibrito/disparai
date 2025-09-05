import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instanceKey = searchParams.get("instanceKey");
    
    if (!instanceKey) {
      return NextResponse.json({ ok: false, error: "instanceKey é obrigatório" }, { status: 400 });
    }

    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    const r = await fetch(`${host}/rest/instance/${instanceKey}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await r.json();
    return NextResponse.json({ ok: r.ok, data }, { status: r.status });
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
