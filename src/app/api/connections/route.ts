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
  apiSecret: z.string().optional(),
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

    return NextResponse.json({ connections });
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

    const body = await req.json();
    const validatedData = connectionSchema.parse(body);

    // Verificar se o usuário já tem uma conexão ativa do mesmo tipo
    const { data: existingConnection } = await supabase
      .from('api_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', validatedData.type)
      .eq('is_active', true)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { error: `Você já possui uma conexão ativa do tipo ${validatedData.type}` },
        { status: 400 }
      );
    }

    // Criar nova conexão
    const { data: connection, error } = await supabase
      .from('api_connections')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        type: validatedData.type,
        phone_number: validatedData.phoneNumber,
        instance_id: validatedData.instanceId,
        api_key: validatedData.apiKey,
        api_secret: validatedData.apiSecret,
        webhook_url: validatedData.webhookUrl,
        description: validatedData.description,
        is_active: true,
        status: 'active',
        message_count: 0,
        monthly_limit: 5000,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connection:', error);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

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
