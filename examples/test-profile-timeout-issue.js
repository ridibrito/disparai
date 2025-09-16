// Script para testar problemas de timeout no perfil
// Execute: node examples/test-profile-timeout-issue.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileTimeoutIssue() {
  try {
    console.log('🔍 Testando problemas de timeout no perfil...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Testar UPDATE com timeout personalizado
    console.log('1️⃣ Testando UPDATE com timeout personalizado...');
    
    const updatePromise = supabase
      .from('users')
      .update({ 
        full_name: 'Ricardo de brito Albuquerque',
        phone: '61983555195',
        bio: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId)
      .select();
    
    // Adicionar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout após 10 segundos')), 10000);
    });
    
    try {
      const result = await Promise.race([updatePromise, timeoutPromise]);
      console.log('✅ UPDATE concluído em tempo hábil:', result);
    } catch (error) {
      if (error.message === 'Timeout após 10 segundos') {
        console.log('❌ UPDATE travou - timeout de 10 segundos');
      } else {
        console.log('❌ Erro no UPDATE:', error.message);
      }
    }
    
    // 2. Testar UPDATE da organização com timeout
    console.log('\n2️⃣ Testando UPDATE da organização com timeout...');
    
    const orgUpdatePromise = supabase
      .from('organizations')
      .update({
        company_name: 'coruss consultoria',
        company_description: '',
        company_website: null,
        company_sector: null,
        company_phone: null,
        company_email: null,
        company_address: null,
        company_city: null,
        company_state: null,
        company_zip_code: null,
        company_country: 'Brasil',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrgId)
      .select();
    
    try {
      const orgResult = await Promise.race([orgUpdatePromise, timeoutPromise]);
      console.log('✅ UPDATE da organização concluído em tempo hábil:', orgResult);
    } catch (error) {
      if (error.message === 'Timeout após 10 segundos') {
        console.log('❌ UPDATE da organização travou - timeout de 10 segundos');
      } else {
        console.log('❌ Erro no UPDATE da organização:', error.message);
      }
    }
    
    // 3. Testar múltiplas operações simultâneas
    console.log('\n3️⃣ Testando múltiplas operações simultâneas...');
    
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testUserId)
          .select()
      );
    }
    
    try {
      const results = await Promise.all(promises);
      console.log('✅ Múltiplas operações concluídas:', results.length);
    } catch (error) {
      console.log('❌ Erro em múltiplas operações:', error.message);
    }
    
    // 4. Testar operação com retry
    console.log('\n4️⃣ Testando operação com retry...');
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testUserId)
          .select();
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ Operação com retry ${retryCount + 1} bem-sucedida:`, data);
        break;
      } catch (error) {
        retryCount++;
        console.log(`⚠️ Tentativa ${retryCount} falhou:`, error.message);
        
        if (retryCount >= maxRetries) {
          console.log('❌ Todas as tentativas falharam');
        } else {
          console.log('🔄 Tentando novamente em 1 segundo...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log('\n🎉 Teste de timeout concluído!');
    
    console.log('\n💡 Possíveis problemas identificados:');
    console.log('   1. Timeout de operações muito longo');
    console.log('   2. Problemas de conectividade com Supabase');
    console.log('   3. Políticas RLS causando travamento');
    console.log('   4. Problemas de autenticação no frontend');
    console.log('   5. Operações bloqueadas por locks de banco');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testProfileTimeoutIssue();
