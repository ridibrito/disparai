import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Criando instância de teste...');
    
    const { organizationId } = await request.json();
    console.log('📦 OrganizationId recebido:', organizationId);
    
    const supabase = createServerClientWithServiceRole();
    
    // Preparar dados
    const instanceKey = `test_${Date.now()}`;
    const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
    const webhookUrl = `${request.nextUrl.origin}/api/webhooks/whatsapp`;
    
    // Se organizationId não for um UUID válido, usar um UUID padrão
    let orgId = organizationId;
    if (!organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      orgId = '00000000-0000-0000-0000-000000000000';
      console.log('⚠️ OrganizationId não é UUID válido, usando UUID padrão');
    }
    
    const insertData = {
      organization_id: orgId,
      instance_key: instanceKey,
      token: megaApiToken,
      status: 'pendente',
      webhook_url: webhookUrl
    };
    
    console.log('📝 Inserindo dados:', insertData);
    
    // Inserir no banco
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir instância',
        details: insertError.message,
        code: insertError.code,
        insertData: insertData
      });
    }
    
    console.log('✅ Instância criada:', instance);
    
    // Gerar QR Code
    const qrResponse = await fetch(`https://teste8.megaapi.com.br/rest/instance/qrcode/${instanceKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${megaApiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const qrResult = await qrResponse.json();
    console.log('📱 QR Code gerado:', qrResult.qrcode ? 'Sim' : 'Não');
    
    if (qrResult.error) {
      return NextResponse.json(
        { error: 'Erro ao gerar QR Code: ' + qrResult.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      instance: {
        id: instance.id,
        instance_key: instanceKey,
        status: 'pendente',
        qr_code: qrResult.qrcode,
        webhook_url: webhookUrl
      },
      note: 'Instância salva no banco e QR Code gerado'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar instância de teste:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}
