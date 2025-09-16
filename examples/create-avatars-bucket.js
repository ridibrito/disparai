// Script para criar o bucket de avatars no Supabase
// Execute: node examples/create-avatars-bucket.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAvatarsBucket() {
  try {
    console.log('🪣 Criando bucket de avatars...\n');
    
    // 1. Verificar se o bucket já existe
    console.log('1️⃣ Verificando se o bucket "avatars" já existe...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    if (avatarsBucket) {
      console.log('✅ Bucket "avatars" já existe');
      console.log('   - Público:', avatarsBucket.public);
      console.log('   - Criado em:', avatarsBucket.created_at);
      return;
    }
    
    // 2. Criar o bucket
    console.log('\n2️⃣ Criando bucket "avatars"...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (createError) {
      console.log('❌ Erro ao criar bucket:', createError);
      return;
    }
    
    console.log('✅ Bucket "avatars" criado com sucesso!');
    console.log('   - Público:', newBucket.public);
    console.log('   - Tipos permitidos: JPEG, PNG, GIF, WebP');
    console.log('   - Tamanho máximo: 5MB');
    
    // 3. Testar upload
    console.log('\n3️⃣ Testando upload...');
    const testContent = 'test';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.log('❌ Erro no teste de upload:', uploadError);
    } else {
      console.log('✅ Teste de upload bem-sucedido');
      
      // Limpar arquivo de teste
      await supabase.storage.from('avatars').remove([testFileName]);
      console.log('🧹 Arquivo de teste removido');
    }
    
    console.log('\n🎉 Bucket de avatars configurado com sucesso!');
    console.log('\n💡 Agora você pode:');
    console.log('   1. Fazer upload de avatars no perfil');
    console.log('   2. As imagens serão públicas e acessíveis');
    console.log('   3. Tamanho máximo de 5MB por arquivo');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
createAvatarsBucket();
