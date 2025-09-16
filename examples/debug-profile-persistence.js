// Script para debugar problemas de persistência do perfil
// Execute: node examples/debug-profile-persistence.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugProfilePersistence() {
  try {
    console.log('🔍 Debugando problemas de persistência do perfil...\n');
    
    // 1. Verificar estrutura da tabela users
    console.log('1️⃣ Verificando estrutura da tabela users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao consultar users:', usersError);
    } else {
      console.log('✅ Estrutura da tabela users:', usersData.length > 0 ? Object.keys(usersData[0]) : 'Tabela vazia');
    }
    
    // 2. Verificar estrutura da tabela organizations
    console.log('\n2️⃣ Verificando estrutura da tabela organizations...');
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError) {
      console.error('❌ Erro ao consultar organizations:', orgsError);
    } else {
      console.log('✅ Estrutura da tabela organizations:', orgsData.length > 0 ? Object.keys(orgsData[0]) : 'Tabela vazia');
    }
    
    // 3. Verificar políticas RLS
    console.log('\n3️⃣ Verificando políticas RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'users' });
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar políticas RLS via RPC (normal)');
    } else {
      console.log('✅ Políticas RLS users:', rlsData);
    }
    
    // 4. Testar UPDATE em users
    console.log('\n4️⃣ Testando UPDATE em users...');
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2'; // ID do usuário do log
    
    const { data: beforeUpdate, error: beforeError } = await supabase
      .from('users')
      .select('full_name, updated_at')
      .eq('id', testUserId)
      .single();
    
    if (beforeError) {
      console.error('❌ Erro ao buscar usuário antes do update:', beforeError);
    } else {
      console.log('✅ Dados antes do update:', beforeUpdate);
      
      // Tentar fazer um update de teste
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString(),
          full_name: beforeUpdate.full_name + ' (teste)'
        })
        .eq('id', testUserId)
        .select();
      
      if (updateError) {
        console.error('❌ Erro ao fazer update de teste:', updateError);
      } else {
        console.log('✅ Update de teste bem-sucedido:', updateData);
        
        // Reverter o teste
        const { error: revertError } = await supabase
          .from('users')
          .update({ 
            full_name: beforeUpdate.full_name,
            updated_at: beforeUpdate.updated_at
          })
          .eq('id', testUserId);
        
        if (revertError) {
          console.error('❌ Erro ao reverter teste:', revertError);
        } else {
          console.log('✅ Teste revertido com sucesso');
        }
      }
    }
    
    // 5. Testar UPDATE em organizations
    console.log('\n5️⃣ Testando UPDATE em organizations...');
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2'; // ID da organização do log
    
    const { data: beforeOrgUpdate, error: beforeOrgError } = await supabase
      .from('organizations')
      .select('company_name, updated_at')
      .eq('id', testOrgId)
      .single();
    
    if (beforeOrgError) {
      console.error('❌ Erro ao buscar organização antes do update:', beforeOrgError);
    } else {
      console.log('✅ Dados da organização antes do update:', beforeOrgUpdate);
      
      // Tentar fazer um update de teste
      const { data: updateOrgData, error: updateOrgError } = await supabase
        .from('organizations')
        .update({ 
          updated_at: new Date().toISOString(),
          company_name: (beforeOrgUpdate.company_name || '') + ' (teste)'
        })
        .eq('id', testOrgId)
        .select();
      
      if (updateOrgError) {
        console.error('❌ Erro ao fazer update de teste na organização:', updateOrgError);
      } else {
        console.log('✅ Update de teste na organização bem-sucedido:', updateOrgData);
        
        // Reverter o teste
        const { error: revertOrgError } = await supabase
          .from('organizations')
          .update({ 
            company_name: beforeOrgUpdate.company_name,
            updated_at: beforeOrgUpdate.updated_at
          })
          .eq('id', testOrgId);
        
        if (revertOrgError) {
          console.error('❌ Erro ao reverter teste da organização:', revertOrgError);
        } else {
          console.log('✅ Teste da organização revertido com sucesso');
        }
      }
    }
    
    // 6. Verificar bucket de avatars
    console.log('\n6️⃣ Verificando bucket de avatars...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      const avatarsBucket = buckets.find(b => b.name === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Bucket avatars encontrado:', avatarsBucket);
      } else {
        console.log('❌ Bucket avatars não encontrado');
      }
    }
    
    console.log('\n🎉 Debug de persistência concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
debugProfilePersistence();
