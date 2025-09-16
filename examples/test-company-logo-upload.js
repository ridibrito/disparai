// Script para testar upload do logo da empresa
// Execute: node examples/test-company-logo-upload.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testCompanyLogoUpload() {
  try {
    console.log('🔍 Testando upload do logo da empresa...\n');
    
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar se o bucket avatars existe
    console.log('1️⃣ Verificando bucket avatars...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    if (avatarsBucket) {
      console.log('✅ Bucket avatars encontrado:', avatarsBucket);
    } else {
      console.log('❌ Bucket avatars não encontrado');
      return;
    }
    
    // 2. Criar um arquivo de teste (imagem simples)
    console.log('\n2️⃣ Criando arquivo de teste...');
    const testImagePath = path.join(__dirname, 'test-logo.png');
    
    // Criar um PNG simples de 1x1 pixel (base64)
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    try {
      fs.writeFileSync(testImagePath, pngData);
      console.log('✅ Arquivo de teste criado:', testImagePath);
    } catch (error) {
      console.error('❌ Erro ao criar arquivo de teste:', error.message);
      return;
    }
    
    // 3. Testar upload do arquivo
    console.log('\n3️⃣ Testando upload do arquivo...');
    const filePath = `${testUserId}/company_logo_${Date.now()}.png`;
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, pngData, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
      } else {
        console.log('✅ Upload bem-sucedido:', uploadData);
        
        // 4. Testar obtenção da URL pública
        console.log('\n4️⃣ Testando obtenção da URL pública...');
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        console.log('✅ URL pública:', urlData.publicUrl);
        
        // 5. Testar atualização da organização com a URL
        console.log('\n5️⃣ Testando atualização da organização...');
        const { data: orgUpdateData, error: orgUpdateError } = await supabase
          .from('organizations')
          .update({
            company_logo_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', testUserId)
          .select();
        
        if (orgUpdateError) {
          console.error('❌ Erro ao atualizar organização:', orgUpdateError);
        } else {
          console.log('✅ Organização atualizada com sucesso:', orgUpdateData);
        }
        
        // 6. Limpar arquivo de teste
        console.log('\n6️⃣ Limpando arquivo de teste...');
        try {
          fs.unlinkSync(testImagePath);
          console.log('✅ Arquivo de teste removido');
        } catch (error) {
          console.log('⚠️ Erro ao remover arquivo de teste:', error.message);
        }
      }
    } catch (error) {
      console.error('❌ Erro geral no upload:', error.message);
    }
    
    console.log('\n🎉 Teste de upload do logo concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testCompanyLogoUpload();
