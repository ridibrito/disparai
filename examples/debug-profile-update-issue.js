// Script para debugar o problema específico de UPDATE do perfil
// Execute: node examples/debug-profile-update-issue.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugProfileUpdateIssue() {
  try {
    console.log('🔍 Debugando problema específico de UPDATE do perfil...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar dados atuais
    console.log('1️⃣ Verificando dados atuais...');
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('✅ Usuário atual:', {
      id: currentUser.id,
      full_name: currentUser.full_name,
      phone: currentUser.phone,
      bio: currentUser.bio,
      avatar_url: currentUser.avatar_url
    });
    
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', testOrgId)
      .single();
    
    if (orgError) {
      console.error('❌ Erro ao buscar organização:', orgError);
      return;
    }
    
    console.log('✅ Organização atual:', {
      id: currentOrg.id,
      company_name: currentOrg.company_name,
      company_description: currentOrg.company_description,
      company_logo_url: currentOrg.company_logo_url
    });
    
    // 2. Testar UPDATE do usuário com dados similares ao formulário
    console.log('\n2️⃣ Testando UPDATE do usuário...');
    const userUpdateData = {
      full_name: 'Ricardo de brito Albuquerque',
      phone: '61983555195',
      bio: '',
      updated_at: new Date().toISOString(),
      avatar_url: currentUser.avatar_url
    };
    
    console.log('📝 Dados para update do usuário:', userUpdateData);
    
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', testUserId)
      .select();
    
    if (updateUserError) {
      console.error('❌ Erro ao atualizar usuário:', updateUserError);
    } else {
      console.log('✅ Usuário atualizado com sucesso:', updatedUser[0]);
    }
    
    // 3. Testar UPDATE da organização com dados similares ao formulário
    console.log('\n3️⃣ Testando UPDATE da organização...');
    const orgUpdateData = {
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
      company_logo_url: currentOrg.company_logo_url,
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Dados para update da organização:', orgUpdateData);
    
    const { data: updatedOrg, error: updateOrgError } = await supabase
      .from('organizations')
      .update(orgUpdateData)
      .eq('id', testOrgId)
      .select();
    
    if (updateOrgError) {
      console.error('❌ Erro ao atualizar organização:', updateOrgError);
    } else {
      console.log('✅ Organização atualizada com sucesso:', updatedOrg[0]);
    }
    
    // 4. Verificar se há problemas de RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    
    // Testar com cliente anônimo (simular frontend)
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: anonUser, error: anonUserError } = await anonSupabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (anonUserError) {
      console.log('⚠️ Cliente anônimo não pode acessar users:', anonUserError.message);
    } else {
      console.log('✅ Cliente anônimo pode acessar users');
    }
    
    const { data: anonOrg, error: anonOrgError } = await anonSupabase
      .from('organizations')
      .select('*')
      .eq('id', testOrgId)
      .single();
    
    if (anonOrgError) {
      console.log('⚠️ Cliente anônimo não pode acessar organizations:', anonOrgError.message);
    } else {
      console.log('✅ Cliente anônimo pode acessar organizations');
    }
    
    // 5. Testar UPDATE com cliente anônimo
    console.log('\n5️⃣ Testando UPDATE com cliente anônimo...');
    
    const { data: anonUpdateUser, error: anonUpdateUserError } = await anonSupabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testUserId)
      .select();
    
    if (anonUpdateUserError) {
      console.log('⚠️ Cliente anônimo não pode atualizar users:', anonUpdateUserError.message);
    } else {
      console.log('✅ Cliente anônimo pode atualizar users');
    }
    
    const { data: anonUpdateOrg, error: anonUpdateOrgError } = await anonSupabase
      .from('organizations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testOrgId)
      .select();
    
    if (anonUpdateOrgError) {
      console.log('⚠️ Cliente anônimo não pode atualizar organizations:', anonUpdateOrgError.message);
    } else {
      console.log('✅ Cliente anônimo pode atualizar organizations');
    }
    
    console.log('\n🎉 Debug de UPDATE concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
debugProfileUpdateIssue();
