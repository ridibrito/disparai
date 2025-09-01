import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// Rota para listar todas as credenciais de API do usuário
export async function GET(req: NextRequest) {
  try {
    // Criar cliente do Supabase
    const supabase = await createServerClient();
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário tem acesso a este recurso com base no plano
    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plans(features)')
      .eq('id', session.user.id)
      .single();
    
    if (!user || !user.plans || !user.plans.features || !user.plans.features.api_personalizada) {
      return NextResponse.json(
        { error: 'Recurso não disponível no seu plano' },
        { status: 403 }
      );
    }
    
    // Buscar todas as credenciais de API do usuário
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Erro ao buscar credenciais:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar credenciais' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ credentials }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Rota para criar ou atualizar credenciais de API
export async function POST(req: NextRequest) {
  try {
    // Criar cliente do Supabase
    const supabase = await createServerClient();
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário tem acesso a este recurso com base no plano
    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plans(features)')
      .eq('id', session.user.id)
      .single();
    
    if (!user || !user.plans || !user.plans.features || !user.plans.features.api_personalizada) {
      return NextResponse.json(
        { error: 'Recurso não disponível no seu plano' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const { 
      id, 
      name, 
      provider, 
      api_key, 
      api_secret, 
      phone_number_id, 
      webhook_url 
    } = await req.json();
    
    // Validar dados obrigatórios
    if (!name || !provider || !api_key) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Preparar dados para inserção/atualização
    const credentialData = {
      user_id: session.user.id,
      name,
      provider,
      api_key,
      api_secret: api_secret || null,
      phone_number_id: phone_number_id || null,
      webhook_url: webhook_url || null,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (id) {
      // Atualizar credencial existente
      const { data, error } = await supabase
        .from('api_credentials')
        .update(credentialData)
        .eq('id', id)
        .eq('user_id', session.user.id) // Garantir que o usuário só pode atualizar suas próprias credenciais
        .select();
      
      if (error) {
        console.error('Erro ao atualizar credencial:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar credencial' },
          { status: 500 }
        );
      }
      
      result = { data, message: 'Credencial atualizada com sucesso' };
    } else {
      // Criar nova credencial
      // Verificar limite de credenciais com base no plano
      const { count, error: countError } = await supabase
        .from('api_credentials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      
      if (countError) {
        console.error('Erro ao contar credenciais:', countError);
        return NextResponse.json(
          { error: 'Erro ao verificar limite de credenciais' },
          { status: 500 }
        );
      }
      
      // Limite de credenciais por plano (ajustar conforme necessário)
      const credentialLimit = user.plans.features.api_limit || 1;
      
      if (count >= credentialLimit) {
        return NextResponse.json(
          { error: `Limite de ${credentialLimit} credenciais atingido no seu plano` },
          { status: 403 }
        );
      }
      
      // Inserir nova credencial
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          ...credentialData,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Erro ao criar credencial:', error);
        return NextResponse.json(
          { error: 'Erro ao criar credencial' },
          { status: 500 }
        );
      }
      
      result = { data, message: 'Credencial criada com sucesso' };
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Rota para excluir uma credencial de API
export async function DELETE(req: NextRequest) {
  try {
    // Criar cliente do Supabase
    const supabase = await createServerClient();
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter ID da credencial da URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da credencial não fornecido' },
        { status: 400 }
      );
    }
    
    // Excluir a credencial, garantindo que pertence ao usuário atual
    const { error } = await supabase
      .from('api_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Erro ao excluir credencial:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir credencial' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Credencial excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}