import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...');

    // 1. Verificar estrutura da tabela whatsapp_instances
    console.log('1️⃣ Verificando whatsapp_instances...');
    const { data: whatsappInstances, error: whatsappError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (whatsappError) {
      console.error('❌ Erro ao acessar whatsapp_instances:', whatsappError);
    } else {
      console.log('✅ whatsapp_instances acessível');
    }

    // 2. Verificar estrutura da tabela users para pegar um organization_id válido
    console.log('2️⃣ Verificando users...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, organization_id')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao acessar users:', usersError);
    } else {
      console.log('✅ users acessível:', users);
    }

    // 3. Verificar estrutura da tabela organizations
    console.log('3️⃣ Verificando organizations...');
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .limit(5);

    if (orgsError) {
      console.error('❌ Erro ao acessar organizations:', orgsError);
    } else {
      console.log('✅ organizations acessível:', organizations);
    }

    // 4. Tentar inserir um registro de teste com dados corretos
    console.log('4️⃣ Testando inserção com dados corretos...');
    const testOrgId = organizations?.[0]?.id || users?.[0]?.organization_id || null;
    
    if (testOrgId) {
      const testRecord = {
        organization_id: testOrgId,
        instance_key: `test_${Date.now()}`,
        token: 'test-token',
        status: 'pendente',
        webhook_url: 'http://test.com/webhook'
      };

      const { data: testInsert, error: testError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert(testRecord as any)
        .select()
        .single();

      if (testError) {
        console.error('❌ Erro ao inserir teste:', testError);
      } else {
        console.log('✅ Teste inserido com sucesso:', testInsert);
        
        // Limpar o teste
        await supabaseAdmin
          .from('whatsapp_instances')
          .delete()
          .eq('id', testInsert.id);
        
        console.log('✅ Teste removido');
      }
    } else {
      console.log('⚠️ Nenhum organization_id válido encontrado');
    }

    return NextResponse.json({
      ok: true,
      message: 'Verificação de estrutura concluída',
      results: {
        whatsappInstances: {
          accessible: !whatsappError,
          error: whatsappError?.message,
          sampleData: whatsappInstances
        },
        users: {
          accessible: !usersError,
          error: usersError?.message,
          sampleData: users
        },
        organizations: {
          accessible: !orgsError,
          error: orgsError?.message,
          sampleData: organizations
        },
        testOrgId: testOrgId
      }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
