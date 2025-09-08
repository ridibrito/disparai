import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { instanceKey } = await req.json();
    
    if (!instanceKey) {
      return NextResponse.json({ ok: false, error: "instanceKey é obrigatório" }, { status: 400 });
    }

    const host = process.env.MEGA_API_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    // Usar o nome exato da instância
    let megaApiKey = instanceKey;

    console.log(`🔑 Testando exclusão: ${instanceKey} -> ${megaApiKey}`);
    console.log(`🌐 Host: ${host}`);

    // Primeiro, verificar se a instância existe
    console.log(`🔍 Verificando se instância existe...`);
    const checkResponse = await fetch(`${host}/rest/instance/${megaApiKey}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log(`📡 Status da verificação: ${checkResponse.status}`);
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('📊 Instância encontrada:', checkData);
    } else {
      const errorText = await checkResponse.text();
      console.log(`❌ Instância não encontrada: ${checkResponse.status} - ${errorText}`);
    }

    // Testar logout
    console.log(`🔌 Testando logout...`);
    const logoutResponse = await fetch(`${host}/rest/instance/${megaApiKey}/logout`, {
      method: 'DELETE',
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log(`📡 Status do logout: ${logoutResponse.status}`);
    if (logoutResponse.ok) {
      const logoutText = await logoutResponse.text();
      console.log('✅ Logout bem-sucedido:', logoutText);
    } else {
      const logoutError = await logoutResponse.text();
      console.log(`❌ Erro no logout: ${logoutResponse.status} - ${logoutError}`);
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Testar delete
    console.log(`🗑️ Testando delete...`);
    const deleteResponse = await fetch(`${host}/rest/instance/${megaApiKey}/delete`, {
      method: 'DELETE',
      headers: { "Authorization": `Bearer ${token}` }
    });

    console.log(`📡 Status do delete: ${deleteResponse.status}`);
    console.log(`📡 Headers do delete:`, Object.fromEntries(deleteResponse.headers.entries()));

    if (deleteResponse.ok) {
      const deleteText = await deleteResponse.text();
      console.log('✅ Delete bem-sucedido:', deleteText);
      
      return NextResponse.json({
        ok: true,
        message: 'Exclusão testada com sucesso',
        results: {
          check: checkResponse.status,
          logout: logoutResponse.status,
          delete: deleteResponse.status
        }
      });
    } else {
      const deleteError = await deleteResponse.text();
      console.log(`❌ Erro no delete: ${deleteResponse.status} - ${deleteError}`);
      
      return NextResponse.json({
        ok: false,
        error: `Erro no delete: ${deleteResponse.status} - ${deleteError}`,
        results: {
          check: checkResponse.status,
          logout: logoutResponse.status,
          delete: deleteResponse.status
        }
      }, { status: deleteResponse.status });
    }

  } catch (error) {
    console.error('❌ Erro ao testar exclusão:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
