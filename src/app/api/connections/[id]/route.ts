import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabaseServer';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  instanceId: z.string().optional(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connection, error } = await supabase
      .from('api_connections')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('GET /api/connections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Verificar se a conexão existe e pertence ao usuário
    const { data: existingConnection } = await supabase
      .from('api_connections')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existingConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Atualizar conexão
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.phoneNumber) updateData.phone_number = validatedData.phoneNumber;
    if (validatedData.instanceId) updateData.instance_id = validatedData.instanceId;
    if (validatedData.apiKey) updateData.api_key = validatedData.apiKey;
    if (validatedData.apiSecret) updateData.api_secret = validatedData.apiSecret;
    if (validatedData.webhookUrl) updateData.webhook_url = validatedData.webhookUrl;
    if (validatedData.description) updateData.description = validatedData.description;
    if (typeof validatedData.is_active === 'boolean') updateData.is_active = validatedData.is_active;

    const { data: connection, error } = await (supabase as any)
      .from('api_connections')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating connection:', error);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      connection,
      message: 'Conexão atualizada com sucesso!' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('PUT /api/connections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a conexão existe e pertence ao usuário
    const { data: existingConnection } = await supabase
      .from('api_connections')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existingConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Deletar conexão
    const { error } = await supabase
      .from('api_connections')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting connection:', error);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Conexão removida com sucesso!' 
    });
  } catch (error) {
    console.error('DELETE /api/connections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
