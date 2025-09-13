import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createDisparaiAPIClient } from '@/lib/disparai-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const { phoneNumber } = params;
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = createServerClient();

    // Buscar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar conexão ativa do Disparai
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp_disparai')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'No active WhatsApp connection found' }, { status: 404 });
    }

    // Criar cliente Disparai
    const disparaiClient = createDisparaiAPIClient(
      connection.instance_id || '',
      connection.api_key
    );

    // Buscar foto de perfil do contato
    const avatarResult = await disparaiClient.getProfilePicture(phoneNumber);

    if (avatarResult.error) {
      console.error('Error fetching contact avatar:', avatarResult.message);
      return NextResponse.json({ error: 'Failed to fetch contact avatar' }, { status: 500 });
    }

    // Retornar dados do avatar
    return NextResponse.json({
      success: true,
      data: {
        profilePicture: avatarResult.data?.profilePicture || null,
        phoneNumber: phoneNumber
      }
    });

  } catch (error) {
    console.error('Error in avatar API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
