import { NextResponse } from "next/server";

export async function GET() {
  try {
    const host = process.env.MEGA_API_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    console.log(`🌐 Testando conexão com MegaAPI: ${host}`);
    console.log(`🔐 Token: ${token.substring(0, 20)}...`);

    // Listar todas as instâncias
    const listResponse = await fetch(`${host}/rest/instance/list`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log(`📡 Status da resposta list: ${listResponse.status}`);
    console.log(`📡 Headers:`, Object.fromEntries(listResponse.headers.entries()));

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('📊 Instâncias encontradas:', listData);
      
      return NextResponse.json({
        ok: true,
        message: 'Conexão com MegaAPI funcionando',
        data: listData
      });
    } else {
      const errorText = await listResponse.text();
      console.log(`❌ Erro ao listar instâncias: ${listResponse.status} - ${errorText}`);
      
      return NextResponse.json({
        ok: false,
        error: `Erro ${listResponse.status}: ${errorText}`,
        status: listResponse.status
      }, { status: listResponse.status });
    }

  } catch (error) {
    console.error('❌ Erro ao testar MegaAPI:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
