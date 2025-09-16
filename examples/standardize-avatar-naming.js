// Script para padronizar nomenclatura do avatar pessoal
// Execute: node examples/standardize-avatar-naming.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function standardizeAvatarNaming() {
  try {
    console.log('📝 Padronizando nomenclatura do avatar pessoal...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar situação atual
    console.log('1️⃣ Verificando situação atual...');
    const { data: currentUser, error: currentError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', testUserId)
      .single();
    
    if (currentError) {
      console.error('❌ Erro ao buscar usuário:', currentError);
      return;
    }
    
    console.log('📋 URL atual no banco:', currentUser.avatar_url);
    
    // 2. Listar arquivos do usuário
    console.log('\n2️⃣ Listando arquivos do usuário...');
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 10 });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
      return;
    }
    
    console.log(`📁 Encontrados ${files.length} arquivos:`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.created_at})`);
    });
    
    // 3. Identificar arquivo de avatar pessoal
    const avatarFile = files.find(f => f.name === '1756910080395.png');
    
    if (!avatarFile) {
      console.log('❌ Arquivo de avatar pessoal não encontrado');
      return;
    }
    
    console.log(`\n👤 Arquivo de avatar encontrado: ${avatarFile.name}`);
    
    // 4. Verificar se já está no padrão correto
    if (avatarFile.name.startsWith('avatar_')) {
      console.log('✅ Arquivo já está no padrão correto');
      return;
    }
    
    // 5. Baixar o arquivo atual
    console.log('\n3️⃣ Baixando arquivo atual...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('avatars')
      .download(`${testUserId}/${avatarFile.name}`);
    
    if (downloadError) {
      console.error('❌ Erro ao baixar arquivo:', downloadError);
      return;
    }
    
    console.log('✅ Arquivo baixado com sucesso');
    
    // 6. Criar novo nome padronizado
    const fileExt = avatarFile.name.split('.').pop();
    const timestamp = Date.now();
    const newFileName = `avatar_${timestamp}.${fileExt}`;
    
    console.log(`📝 Novo nome: ${newFileName}`);
    
    // 7. Fazer upload com novo nome
    console.log('\n4️⃣ Fazendo upload com novo nome...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`${testUserId}/${newFileName}`, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Erro ao fazer upload:', uploadError);
      return;
    }
    
    console.log('✅ Upload realizado com sucesso');
    
    // 8. Gerar nova URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${testUserId}/${newFileName}`);
    
    const newAvatarUrl = urlData.publicUrl;
    console.log(`🔗 Nova URL: ${newAvatarUrl}`);
    
    // 9. Atualizar banco de dados
    console.log('\n5️⃣ Atualizando banco de dados...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError);
      return;
    }
    
    console.log('✅ Usuário atualizado com sucesso!');
    console.log('📋 Nova URL no banco:', updateData[0].avatar_url);
    
    // 10. Verificar se a nova URL é acessível
    console.log('\n6️⃣ Verificando acessibilidade da nova URL...');
    try {
      const response = await fetch(newAvatarUrl, { method: 'HEAD' });
      console.log(`✅ URL acessível: ${response.ok ? 'Sim' : 'Não'} (${response.status})`);
    } catch (error) {
      console.log(`❌ Erro ao testar URL: ${error.message}`);
    }
    
    // 11. Excluir arquivo antigo
    console.log('\n7️⃣ Excluindo arquivo antigo...');
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([`${testUserId}/${avatarFile.name}`]);
    
    if (deleteError) {
      console.error('❌ Erro ao excluir arquivo antigo:', deleteError);
    } else {
      console.log('✅ Arquivo antigo excluído com sucesso');
    }
    
    // 12. Verificar arquivos finais
    console.log('\n8️⃣ Verificando arquivos finais...');
    const { data: finalFiles, error: finalError } = await supabase.storage
      .from('avatars')
      .list(testUserId, { limit: 10 });
    
    if (finalError) {
      console.error('❌ Erro ao verificar arquivos finais:', finalError);
    } else {
      console.log(`📁 Arquivos finais (${finalFiles.length}):`);
      finalFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.created_at})`);
      });
    }
    
    console.log('\n🎉 Padronização da nomenclatura concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
standardizeAvatarNaming();
