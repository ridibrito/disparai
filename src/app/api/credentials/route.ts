import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, provider, api_key, api_secret, phone_number_id, webhook_url } = body;
    
    // Validar campos obrigatórios
    if (!name || !provider || !api_key) {
      return NextResponse.json(
        { error: 'Nome, provedor e chave de API são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário tem permissão para API personalizada
    const { data: user } = await supabase
      .from('users')
      .select(`
        plans!inner(
          api_personalizada,
          api_limit
        )
      `)
      .eq('id', session.user.id)
      .single();
    
    const userPlan = user;
    
    if (!userPlan?.plans?.api_personalizada) {
      return NextResponse.json(
        { error: 'Seu plano não permite API personalizada. Faça upgrade para continuar.' },
        { status: 403 }
      );
    }
    
    // Verificar limite de APIs
    const { count: existingCredentials } = await supabase
      .from('api_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    
    if (existingCredentials && existingCredentials >= userPlan.plans.api_limit) {
      return NextResponse.json(
        { error: `Limite de ${userPlan.plans.api_limit} credenciais de API atingido. Faça upgrade para adicionar mais.` },
        { status: 403 }
      );
    }
    
    // Inserir credenciais no banco
    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        user_id: session.user.id,
        name,
        provider,
        api_key,
        api_secret,
        phone_number_id,
        webhook_url
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar credenciais:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar credenciais' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Credenciais salvas com sucesso', data },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { id, name, provider, api_key, api_secret, phone_number_id, webhook_url } = body;
    
    // Validar campos obrigatórios
    if (!id || !name || !provider || !api_key) {
      return NextResponse.json(
        { error: 'ID, nome, provedor e chave de API são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se a credencial pertence ao usuário
    const { data: existingCredential } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (!existingCredential) {
      return NextResponse.json(
        { error: 'Credencial não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar credenciais
    const { data, error } = await supabase
      .from('api_credentials')
      .update({
        name,
        provider,
        api_key,
        api_secret,
        phone_number_id,
        webhook_url
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar credenciais:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar credenciais' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Credenciais atualizadas com sucesso', data },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da credencial é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se a credencial pertence ao usuário
    const { data: existingCredential } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (!existingCredential) {
      return NextResponse.json(
        { error: 'Credencial não encontrada' },
        { status: 404 }
      );
    }
    
    // Deletar credencial
    const { error } = await supabase
      .from('api_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Erro ao deletar credencial:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar credencial' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Credencial deletada com sucesso' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}