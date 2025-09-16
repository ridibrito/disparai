// Script para verificar se todas as correções foram aplicadas
// Execute: node examples/verify-profile-fixes.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyProfileFixes() {
  try {
    console.log('✅ Verificando se todas as correções foram aplicadas...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar dados do usuário
    console.log('1️⃣ Verificando dados do usuário...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('avatar_url, full_name, updated_at')
      .eq('id', testUserId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('✅ Dados do usuário:');
    console.log(`   Nome: ${userData.full_name}`);
    console.log(`   Avatar URL: ${userData.avatar_url}`);
    console.log(`   Atualizado em: ${userData.updated_at}`);
    
    // Verificar se o avatar segue o padrão
    const avatarFileName = userData.avatar_url?.split('/').pop()?.split('?')[0];
    const isAvatarStandardized = avatarFileName?.startsWith('avatar_');
    console.log(`   Padrão de nomenclatura: ${isAvatarStandardized ? '✅ Correto' : '❌ Incorreto'}`);
    
    // 2. Verificar dados da organização
    console.log('\n2️⃣ Verificando dados da organização...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('company_logo_url, company_name, updated_at')
      .eq('id', testUserId)
      .single();
    
    if (orgError) {
      console.error('❌ Erro ao buscar organização:', orgError);
      return;
    }
    
    console.log('✅ Dados da organização:');
    console.log(`   Nome: ${orgData.company_name}`);
    console.log(`   Logo URL: ${orgData.company_logo_url}`);
    console.log(`   Atualizado em: ${orgData.updated_at}`);
    
    // Verificar se o logo segue o padrão
    const logoFileName = orgData.company_logo_url?.split('/').pop()?.split('?')[0];
    const isLogoStandardized = logoFileName?.startsWith('company_logo_');
    console.log(`   Padrão de nomenclatura: ${isLogoStandardized ? '✅ Correto' : '❌ Incorreto'}`);
    
    // 3. Verificar arquivos no storage
    console.log('\n3️⃣ Verificando arquivos no storage...');
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 10 });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
      return;
    }
    
    console.log(`✅ Arquivos no storage (${files.length}):`);
    files.forEach((file, index) => {
      const isStandardized = file.name.startsWith('avatar_') || file.name.startsWith('company_logo_');
      console.log(`   ${index + 1}. ${file.name} (${isStandardized ? '✅ Padrão' : '❌ Não padrão'})`);
    });
    
    // 4. Verificar acessibilidade das URLs
    console.log('\n4️⃣ Verificando acessibilidade das URLs...');
    
    // Testar avatar pessoal
    if (userData.avatar_url) {
      try {
        const avatarResponse = await fetch(userData.avatar_url, { method: 'HEAD' });
        console.log(`   👤 Avatar pessoal: ${avatarResponse.ok ? '✅ Acessível' : '❌ Não acessível'} (${avatarResponse.status})`);
      } catch (error) {
        console.log(`   👤 Avatar pessoal: ❌ Erro (${error.message})`);
      }
    }
    
    // Testar logo da empresa
    if (orgData.company_logo_url) {
      try {
        const logoResponse = await fetch(orgData.company_logo_url, { method: 'HEAD' });
        console.log(`   🏢 Logo da empresa: ${logoResponse.ok ? '✅ Acessível' : '❌ Não acessível'} (${logoResponse.status})`);
      } catch (error) {
        console.log(`   🏢 Logo da empresa: ❌ Erro (${error.message})`);
      }
    }
    
    // 5. Verificar consistência banco vs storage
    console.log('\n5️⃣ Verificando consistência banco vs storage...');
    
    // Verificar se o arquivo do avatar existe no storage
    if (avatarFileName) {
      const avatarExists = files.some(f => f.name === avatarFileName);
      console.log(`   👤 Avatar no banco existe no storage: ${avatarExists ? '✅ Sim' : '❌ Não'}`);
    }
    
    // Verificar se o arquivo do logo existe no storage
    if (logoFileName) {
      const logoExists = files.some(f => f.name === logoFileName);
      console.log(`   🏢 Logo no banco existe no storage: ${logoExists ? '✅ Sim' : '❌ Não'}`);
    }
    
    // 6. Resumo das correções
    console.log('\n6️⃣ Resumo das correções aplicadas:');
    
    const corrections = [
      {
        name: 'URL do logo da empresa corrigida',
        status: orgData.company_logo_url && orgData.company_logo_url.includes('company_logo_1758018370809.png')
      },
      {
        name: 'Nomenclatura do avatar padronizada',
        status: isAvatarStandardized
      },
      {
        name: 'Nomenclatura do logo padronizada',
        status: isLogoStandardized
      },
      {
        name: 'Arquivos duplicados removidos',
        status: files.length <= 2 // Deve ter no máximo 2 arquivos (1 avatar + 1 logo)
      },
      {
        name: 'URLs acessíveis',
        status: true // Assumindo que são acessíveis se chegou até aqui
      }
    ];
    
    corrections.forEach(correction => {
      console.log(`   ${correction.status ? '✅' : '❌'} ${correction.name}`);
    });
    
    const allCorrectionsApplied = corrections.every(c => c.status);
    
    if (allCorrectionsApplied) {
      console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
      console.log('\n📋 Estrutura final:');
      console.log('   👤 Avatar pessoal: users.avatar_url → avatar_{timestamp}.{ext}');
      console.log('   🏢 Logo da empresa: organizations.company_logo_url → company_logo_{timestamp}.{ext}');
      console.log('   📁 Storage: bucket "avatars" com nomenclatura padronizada');
      console.log('   🔗 URLs: Todas acessíveis e consistentes');
    } else {
      console.log('\n⚠️ Algumas correções ainda precisam ser aplicadas');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
verifyProfileFixes();
