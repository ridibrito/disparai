import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const { phoneNumber } = params;
    console.log('🔍 Avatar API called for phone:', phoneNumber);
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar usuário autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar conexão ativa do Disparai
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('type', 'whatsapp_disparai')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('🔗 Connection result:', { connection: connection?.id, error: connectionError });
    if (connectionError || !connection) {
      return NextResponse.json({ error: 'No active WhatsApp connection found' }, { status: 404 });
    }

    // Buscar avatar diretamente via fetch
    const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
    const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

    const avatarResponse = await fetch(
      `${host}/rest/instance/getProfilePicture/${phoneNumber}?instance_key=${connection.instance_id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const avatarData = await avatarResponse.json();
    console.log('📸 Avatar response:', avatarData);

    if (!avatarResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
    }

    // Retornar dados do avatar
    return NextResponse.json({
      success: true,
      data: {
        profilePicture: avatarData?.profilePicture || null,
        phoneNumber: phoneNumber
      }
    });

  } catch (error) {
    console.error('❌ Error in avatar API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
