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

    console.log('📱 Gerando QR Code para instância:', instanceKey);

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
    const qrResponse = await fetch(`${host}/rest/instance/qrcode_base64/${instanceKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error('❌ Erro ao gerar QR Code:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao gerar QR Code: ' + errorText 
      }, { status: qrResponse.status });
    }

    const qrData = await qrResponse.json();
    
    if (!qrData.qrcode) {
      return NextResponse.json({ 
        success: false, 
        error: 'QR Code não foi gerado pela API' 
      }, { status: 400 });
    }

    console.log('✅ QR Code gerado com sucesso para:', instanceKey);

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
