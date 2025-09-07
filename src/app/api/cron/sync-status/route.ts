import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (pode ser do Vercel Cron ou manual)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('⏰ [CRON] Iniciando sincronização automática de status...');
    
    // Chamar a API de sincronização
    const syncResponse = await fetch(`${req.nextUrl.origin}/api/sync-instance-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!syncResponse.ok) {
      throw new Error(`Erro na sincronização: ${syncResponse.status}`);
    }

    const syncResult = await syncResponse.json();
    
    console.log('✅ [CRON] Sincronização automática concluída:', syncResult);

    return NextResponse.json({
      success: true,
      message: 'Sincronização automática executada com sucesso',
      timestamp: new Date().toISOString(),
      result: syncResult
    });

  } catch (error) {
    console.error('❌ [CRON] Erro na sincronização automática:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint POST para chamadas manuais
export async function POST(req: NextRequest) {
  return GET(req);
}
