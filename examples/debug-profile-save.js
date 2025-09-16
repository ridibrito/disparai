// Script para diagnosticar problemas de salvamento do perfil
// Execute: node examples/debug-profile-save.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileSave() {
  try {
    console.log('🔍 Diagnosticando problemas de salvamento do perfil...\n');
    
    // 1. Verificar se o bucket de avatars existe
    console.log('1️⃣ Verificando bucket de avatars...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log('❌ Erro ao listar buckets:', bucketsError);
      } else {
        console.log('✅ Buckets encontrados:');
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
        
        const avatarsBucket = buckets.find(b => b.name === 'avatars');
        if (avatarsBucket) {
          console.log('✅ Bucket "avatars" encontrado');
        } else {
          console.log('❌ Bucket "avatars" não encontrado');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar buckets:', error.message);
    }
    
    // 2. Verificar estrutura da tabela users
    console.log('\n2️⃣ Verificando estrutura da tabela users...');
    try {
      const { data: userSample, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userError) {
        console.log('❌ Erro ao verificar tabela users:', userError);
      } else if (userSample && userSample.length > 0) {
        console.log('✅ Campos disponíveis na tabela users:');
        const fields = Object.keys(userSample[0]);
        fields.forEach(field => {
          console.log(`   - ${field}: ${typeof userSample[0][field]}`);
        });
      } else {
        console.log('⚠️ Nenhum usuário encontrado na tabela');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar tabela users:', error.message);
    }
    
    // 3. Verificar estrutura da tabela organizations
    console.log('\n3️⃣ Verificando estrutura da tabela organizations...');
    try {
      const { data: orgSample, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
      
      if (orgError) {
        console.log('❌ Erro ao verificar tabela organizations:', orgError);
      } else if (orgSample && orgSample.length > 0) {
        console.log('✅ Campos disponíveis na tabela organizations:');
        const fields = Object.keys(orgSample[0]);
        fields.forEach(field => {
          console.log(`   - ${field}: ${typeof orgSample[0][field]}`);
        });
      } else {
        console.log('⚠️ Nenhuma organização encontrada na tabela');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar tabela organizations:', error.message);
    }
    
    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_rls_policies', { table_name: 'users' })
        .catch(() => ({ data: null, error: { message: 'Função não disponível' } }));
      
      if (policiesError) {
        console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError.message);
      } else {
        console.log('✅ Políticas RLS encontradas:', policies);
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar políticas RLS:', error.message);
    }
    
    // 5. Testar upload de arquivo
    console.log('\n5️⃣ Testando upload de arquivo...');
    try {
      // Criar um arquivo de teste
      const testContent = 'test';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(testFileName, testFile);
      
      if (uploadError) {
        console.log('❌ Erro no upload de teste:', uploadError);
      } else {
        console.log('✅ Upload de teste bem-sucedido:', uploadData);
        
        // Limpar arquivo de teste
        await supabase.storage.from('avatars').remove([testFileName]);
        console.log('🧹 Arquivo de teste removido');
      }
    } catch (error) {
      console.log('❌ Erro no teste de upload:', error.message);
    }
    
    console.log('\n🎉 Diagnóstico concluído!');
    console.log('\n💡 Possíveis problemas identificados:');
    console.log('   1. Bucket "avatars" não existe');
    console.log('   2. Políticas RLS impedem atualização');
    console.log('   3. Campos não existem nas tabelas');
    console.log('   4. Problemas de permissão no storage');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
debugProfileSave();
