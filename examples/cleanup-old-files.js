// Script para limpar arquivos antigos/duplicados do storage
// Execute: node examples/cleanup-old-files.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function cleanupOldFiles() {
  try {
    console.log('🧹 Limpando arquivos antigos/duplicados do storage...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Listar todos os arquivos do usuário
    console.log('1️⃣ Listando arquivos do usuário...');
    const { data: allFiles, error: allFilesError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 50 });
    
    if (allFilesError) {
      console.error('❌ Erro ao listar arquivos:', allFilesError);
      return;
    }
    
    console.log(`📁 Encontrados ${allFiles.length} arquivos:`);
    allFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.created_at})`);
    });
    
    // 2. Separar arquivos por tipo
    const avatarFiles = allFiles.filter(f => f.name.includes('avatar_'));
    const logoFiles = allFiles.filter(f => f.name.includes('company_logo_'));
    const otherFiles = allFiles.filter(f => !f.name.includes('avatar_') && !f.name.includes('company_logo_'));
    
    console.log(`\n📊 Resumo por tipo:`);
    console.log(`   👤 Avatars pessoais: ${avatarFiles.length}`);
    console.log(`   🏢 Logos da empresa: ${logoFiles.length}`);
    console.log(`   ❓ Outros arquivos: ${otherFiles.length}`);
    
    // 3. Identificar arquivos para manter (mais recentes)
    const filesToKeep = [];
    const filesToDelete = [];
    
    // Manter o avatar mais recente
    if (avatarFiles.length > 0) {
      const latestAvatar = avatarFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      filesToKeep.push(latestAvatar);
      console.log(`\n👤 Avatar a manter: ${latestAvatar.name}`);
      
      // Marcar outros avatars para exclusão
      const otherAvatars = avatarFiles.filter(f => f.name !== latestAvatar.name);
      filesToDelete.push(...otherAvatars);
      if (otherAvatars.length > 0) {
        console.log(`   Avatars para excluir: ${otherAvatars.map(f => f.name).join(', ')}`);
      }
    }
    
    // Manter o logo mais recente
    if (logoFiles.length > 0) {
      const latestLogo = logoFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      filesToKeep.push(latestLogo);
      console.log(`\n🏢 Logo a manter: ${latestLogo.name}`);
      
      // Marcar outros logos para exclusão
      const otherLogos = logoFiles.filter(f => f.name !== latestLogo.name);
      filesToDelete.push(...otherLogos);
      if (otherLogos.length > 0) {
        console.log(`   Logos para excluir: ${otherLogos.map(f => f.name).join(', ')}`);
      }
    }
    
    // Manter outros arquivos (não sabemos o que são)
    if (otherFiles.length > 0) {
      console.log(`\n❓ Outros arquivos (mantendo todos):`);
      otherFiles.forEach(file => {
        console.log(`   - ${file.name}`);
        filesToKeep.push(file);
      });
    }
    
    // 4. Mostrar resumo da limpeza
    console.log(`\n📋 Resumo da limpeza:`);
    console.log(`   ✅ Arquivos a manter: ${filesToKeep.length}`);
    console.log(`   🗑️ Arquivos a excluir: ${filesToDelete.length}`);
    
    if (filesToDelete.length === 0) {
      console.log('✅ Nenhum arquivo duplicado encontrado, limpeza não necessária');
      return;
    }
    
    // 5. Confirmar exclusão (em produção, você pode querer adicionar uma confirmação)
    console.log(`\n⚠️ ATENÇÃO: ${filesToDelete.length} arquivos serão excluídos!`);
    console.log('Arquivos a serem excluídos:');
    filesToDelete.forEach(file => {
      console.log(`   - ${file.name} (${file.created_at})`);
    });
    
    // 6. Executar exclusões
    console.log(`\n🗑️ Excluindo arquivos...`);
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const file of filesToDelete) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`${testUserId}/${file.name}`]);
        
        if (deleteError) {
          console.log(`❌ Erro ao excluir ${file.name}: ${deleteError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Excluído: ${file.name}`);
          deletedCount++;
        }
      } catch (error) {
        console.log(`❌ Erro ao excluir ${file.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // 7. Verificar resultado
    console.log(`\n📊 Resultado da limpeza:`);
    console.log(`   ✅ Arquivos excluídos: ${deletedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
    // 8. Verificar arquivos restantes
    console.log(`\n🔍 Verificando arquivos restantes...`);
    const { data: remainingFiles, error: remainingError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 50 });
    
    if (remainingError) {
      console.error('❌ Erro ao verificar arquivos restantes:', remainingError);
    } else {
      console.log(`📁 Arquivos restantes: ${remainingFiles.length}`);
      remainingFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.created_at})`);
      });
    }
    
    console.log('\n🎉 Limpeza de arquivos concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
cleanupOldFiles();
