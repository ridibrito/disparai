import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabaseServer';

const connectionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['whatsapp_cloud', 'whatsapp_disparai']),
  phoneNumber: z.string().optional(),
  instanceId: z.string().optional(),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1), // Obrigatório para whatsapp_disparai
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar conexões do usuário
    const { data: connections, error } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Para conexões Disparai, verificar status real no MegaAPI
    const connectionsWithStatus = await Promise.all(
      connections.map(async (connection) => {
        if (connection.type === 'whatsapp_disparai' && connection.instance_id) {
          try {
            const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/${connection.instance_id}`, {
              headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs'
              }
            });
            
            const result = await response.json();
            
            if (!result.error && result.instance) {
              return {
                ...connection,
                status: result.instance.status === 'connected' ? 'connected' : 'disconnected'
              };
            }
          } catch (error) {
            console.error('Error checking status for connection:', connection.id, error);
          }
        }
        
        // Para outras conexões ou em caso de erro, manter status original
        return {
          ...connection,
          status: connection.status === 'active' ? 'connected' : connection.status
        };
      })
    );

    return NextResponse.json({ connections: connectionsWithStatus });
  } catch (error) {
    console.error('GET /api/connections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter organization_id do usuário
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao obter perfil do usuário:', userError);
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
    }

    if (!userProfile?.organization_id) {
      console.error('❌ Usuário sem organization_id:', user.id);
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    console.log('🏢 Organization ID:', userProfile.organization_id);

    const body = await req.json();
    console.log('📥 POST /api/connections - Body recebido:', body);
    
    const validatedData = connectionSchema.parse(body);
    console.log('✅ Dados validados:', validatedData);

    // Verificar se o usuário já tem uma conexão ativa do mesmo tipo
    console.log('🔍 Verificando conexões existentes para user:', user.id, 'type:', validatedData.type);
    
    const { data: existingConnection, error: checkError } = await supabase
      .from('api_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', validatedData.type)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar conexões existentes:', checkError);
      return NextResponse.json({ error: 'Failed to check existing connections' }, { status: 500 });
    }

    if (existingConnection) {
      console.log('⚠️ Conexão existente encontrada:', existingConnection);
      return NextResponse.json(
        { error: `Você já possui uma conexão ativa do tipo ${validatedData.type}` },
        { status: 400 }
      );
    }

    // Criar nova conexão (apenas campos que existem na tabela)
    const insertData = {
      user_id: user.id,
      organization_id: userProfile.organization_id,
      name: validatedData.name,
      type: validatedData.type,
      phone_number: validatedData.phoneNumber,
      instance_id: validatedData.instanceId,
      api_key: validatedData.apiKey,
      api_secret: validatedData.apiSecret,
      webhook_url: validatedData.webhookUrl,
      description: validatedData.description,
      is_active: true,
      status: 'active'
    };
    
    console.log('💾 Inserindo dados no Supabase:', insertData);
    
    const { data: connection, error } = await supabase
      .from('api_connections')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar conexão:', error);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }
    
    console.log('✅ Conexão criada com sucesso:', connection);

    return NextResponse.json({ 
      connection,
      message: 'Conexão criada com sucesso!' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('POST /api/connections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
