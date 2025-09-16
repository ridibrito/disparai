// Script para analisar arquivos específicos no storage
// Execute: node examples/analyze-storage-files.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function analyzeStorageFiles() {
  try {
    console.log('🔍 Analisando arquivos específicos no storage...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Listar arquivos do usuário específico
    console.log('1️⃣ Arquivos do usuário no bucket avatars:');
    const { data: userFiles, error: userFilesError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 20 });
    
    if (userFilesError) {
      console.error('❌ Erro ao listar arquivos do usuário:', userFilesError);
    } else {
      console.log(`✅ Encontrados ${userFiles.length} arquivos para o usuário ${testUserId}:`);
      userFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
        console.log(`      - Tamanho: ${file.metadata?.size || 'unknown'} bytes`);
        console.log(`      - Tipo: ${file.metadata?.mimetype || 'unknown'}`);
        console.log(`      - Criado: ${file.created_at || 'unknown'}`);
        console.log(`      - Atualizado: ${file.updated_at || 'unknown'}`);
        
        // Classificar o tipo de arquivo baseado no nome
        if (file.name.includes('avatar_')) {
          console.log(`      - Tipo: 👤 Avatar pessoal`);
        } else if (file.name.includes('company_logo_')) {
          console.log(`      - Tipo: 🏢 Logo da empresa`);
        } else {
          console.log(`      - Tipo: ❓ Desconhecido`);
        }
        console.log('');
      });
    }
    
    // 2. Verificar URLs públicas dos arquivos
    console.log('2️⃣ URLs públicas dos arquivos:');
    if (userFiles && userFiles.length > 0) {
      userFiles.forEach((file, index) => {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${testUserId}/${file.name}`);
        
        console.log(`   ${index + 1}. ${file.name}:`);
        console.log(`      URL: ${urlData.publicUrl}`);
        console.log('');
      });
    }
    
    // 3. Verificar se os arquivos estão acessíveis
    console.log('3️⃣ Verificando acessibilidade dos arquivos:');
    if (userFiles && userFiles.length > 0) {
      for (const file of userFiles.slice(0, 3)) { // Testar apenas os primeiros 3
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${testUserId}/${file.name}`);
        
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          console.log(`   ${file.name}: ${response.ok ? '✅ Acessível' : '❌ Não acessível'} (${response.status})`);
        } catch (error) {
          console.log(`   ${file.name}: ❌ Erro ao verificar (${error.message})`);
        }
      }
    }
    
    // 4. Resumo da estrutura de arquivos
    console.log('\n4️⃣ Resumo da estrutura de arquivos:');
    if (userFiles && userFiles.length > 0) {
      const avatarFiles = userFiles.filter(f => f.name.includes('avatar_'));
      const logoFiles = userFiles.filter(f => f.name.includes('company_logo_'));
      const otherFiles = userFiles.filter(f => !f.name.includes('avatar_') && !f.name.includes('company_logo_'));
      
      console.log(`   👤 Avatars pessoais: ${avatarFiles.length}`);
      console.log(`   🏢 Logos da empresa: ${logoFiles.length}`);
      console.log(`   ❓ Outros arquivos: ${otherFiles.length}`);
      console.log(`   📊 Total: ${userFiles.length}`);
      
      if (avatarFiles.length > 0) {
        console.log('\n   📋 Avatars pessoais encontrados:');
        avatarFiles.forEach(file => {
          console.log(`      - ${file.name}`);
        });
      }
      
      if (logoFiles.length > 0) {
        console.log('\n   📋 Logos da empresa encontrados:');
        logoFiles.forEach(file => {
          console.log(`      - ${file.name}`);
        });
      }
      
      if (otherFiles.length > 0) {
        console.log('\n   📋 Outros arquivos encontrados:');
        otherFiles.forEach(file => {
          console.log(`      - ${file.name}`);
        });
      }
    }
    
    // 5. Verificar dados no banco vs arquivos no storage
    console.log('\n5️⃣ Verificando consistência banco vs storage:');
    
    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', testUserId)
      .single();
    
    // Buscar dados da organização
    const { data: orgData } = await supabase
      .from('organizations')
      .select('company_logo_url')
      .eq('id', testUserId)
      .single();
    
    console.log('   👤 Avatar pessoal no banco:');
    console.log(`      URL: ${userData?.avatar_url || 'null'}`);
    if (userData?.avatar_url) {
      const avatarFileName = userData.avatar_url.split('/').pop().split('?')[0];
      const fileExists = userFiles?.some(f => f.name === avatarFileName);
      console.log(`      Arquivo existe no storage: ${fileExists ? '✅ Sim' : '❌ Não'}`);
    }
    
    console.log('\n   🏢 Logo da empresa no banco:');
    console.log(`      URL: ${orgData?.company_logo_url || 'null'}`);
    if (orgData?.company_logo_url) {
      const logoFileName = orgData.company_logo_url.split('/').pop().split('?')[0];
      const fileExists = userFiles?.some(f => f.name === logoFileName);
      console.log(`      Arquivo existe no storage: ${fileExists ? '✅ Sim' : '❌ Não'}`);
    }
    
    console.log('\n🎉 Análise de arquivos concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
analyzeStorageFiles();
