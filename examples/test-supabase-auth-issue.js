// Script para testar problemas de autenticação do Supabase
// Execute: node examples/test-supabase-auth-issue.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAuthIssue() {
  try {
    console.log('🔍 Testando problemas de autenticação do Supabase...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar se o cliente está autenticado
    console.log('1️⃣ Verificando autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
    } else {
      console.log('✅ Sessão atual:', session ? 'Autenticado' : 'Não autenticado');
      if (session) {
        console.log('   User ID:', session.user.id);
        console.log('   Email:', session.user.email);
      }
    }
    
    // 2. Tentar fazer login com as credenciais do usuário
    console.log('\n2️⃣ Tentando fazer login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'ricardo@coruss.com.br',
      password: '123456' // Senha padrão para teste
    });
    
    if (loginError) {
      console.log('⚠️ Erro no login:', loginError.message);
      console.log('   Isso é normal se a senha estiver incorreta');
    } else {
      console.log('✅ Login bem-sucedido:', loginData.user.email);
    }
    
    // 3. Testar UPDATE com cliente não autenticado
    console.log('\n3️⃣ Testando UPDATE com cliente não autenticado...');
    
    const { data: anonUpdateUser, error: anonUpdateUserError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testUserId)
      .select();
    
    if (anonUpdateUserError) {
      console.log('❌ Cliente não autenticado não pode atualizar users:', anonUpdateUserError.message);
    } else {
      console.log('✅ Cliente não autenticado pode atualizar users (problema de RLS!)');
    }
    
    const { data: anonUpdateOrg, error: anonUpdateOrgError } = await supabase
      .from('organizations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testOrgId)
      .select();
    
    if (anonUpdateOrgError) {
      console.log('❌ Cliente não autenticado não pode atualizar organizations:', anonUpdateOrgError.message);
    } else {
      console.log('✅ Cliente não autenticado pode atualizar organizations (problema de RLS!)');
    }
    
    // 4. Testar SELECT com cliente não autenticado
    console.log('\n4️⃣ Testando SELECT com cliente não autenticado...');
    
    const { data: anonSelectUser, error: anonSelectUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (anonSelectUserError) {
      console.log('❌ Cliente não autenticado não pode fazer SELECT em users:', anonSelectUserError.message);
    } else {
      console.log('✅ Cliente não autenticado pode fazer SELECT em users (problema de RLS!)');
    }
    
    const { data: anonSelectOrg, error: anonSelectOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', testOrgId)
      .single();
    
    if (anonSelectOrgError) {
      console.log('❌ Cliente não autenticado não pode fazer SELECT em organizations:', anonSelectOrgError.message);
    } else {
      console.log('✅ Cliente não autenticado pode fazer SELECT em organizations (problema de RLS!)');
    }
    
    // 5. Verificar se há problemas de timeout
    console.log('\n5️⃣ Testando timeout de operações...');
    
    const startTime = Date.now();
    const { data: timeoutTest, error: timeoutError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testUserId)
      .select();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (timeoutError) {
      console.log('❌ Erro no teste de timeout:', timeoutError.message);
    } else {
      console.log(`✅ Operação concluída em ${duration}ms`);
      if (duration > 5000) {
        console.log('⚠️ Operação muito lenta, pode estar causando timeout no frontend');
      }
    }
    
    console.log('\n🎉 Teste de autenticação concluído!');
    
    console.log('\n💡 Possíveis problemas identificados:');
    console.log('   1. Cliente Supabase não está autenticado no frontend');
    console.log('   2. Políticas RLS muito permissivas (permitem UPDATE sem autenticação)');
    console.log('   3. Timeout de operações muito longo');
    console.log('   4. Problemas de rede ou conectividade');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testSupabaseAuthIssue();
