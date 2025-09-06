import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {    // Primeiro, tentar buscar apenas api_connections
    const { data, error } = await supabase
      .from("api_connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar conexões:', error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    console.log('✅ Conexões carregadas:', data?.length || 0);
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('📥 Payload recebido:', payload);
    
    // Verificar se o payload tem user_id, se não tiver, tentar obter do token
    if (!payload.user_id) {
      // Buscar usuário logado (isso pode precisar ser ajustado dependendo da autenticação)
      console.log('⚠️ user_id não fornecido no payload');
    }
    
    const { data, error } = await supabase
      .from("api_connections")
      .upsert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('❌ Erro ao salvar conexão:', error);
      return NextResponse.json({ 
        ok: false, 
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 });
    }
    
    console.log('✅ Conexão salva:', data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
