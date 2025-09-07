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

    // Verificar se a instância existe no Supabase
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_key', instanceKey)
      .single();

    if (!instance) {
      return NextResponse.json({ 
        success: false, 
        error: 'Instância não encontrada no banco de dados' 
      }, { status: 404 });
    }

    // Gerar QR Code no MegaAPI
    const qrData = await MegaAPI.getQrCode(instanceKey);
    
    if (!qrData.qrcode) {
      return NextResponse.json({ 
        success: false, 
        error: 'QR Code não foi gerado pela API' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      instance_key: instanceKey,
      qr_code: qrData.qrcode,
      instance: instance
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
