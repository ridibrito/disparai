// Script para analisar a estrutura de avatars no banco de dados
// Execute: node examples/analyze-avatar-structure.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function analyzeAvatarStructure() {
  try {
    console.log('🔍 Analisando estrutura de avatars no banco de dados...\n');
    
    // 1. Analisar estrutura da tabela users
    console.log('1️⃣ Estrutura da tabela users:');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao consultar users:', usersError);
    } else if (usersData.length > 0) {
      const userFields = Object.keys(usersData[0]);
      console.log('✅ Campos da tabela users:', userFields);
      
      // Verificar campos relacionados a avatar/imagem
      const avatarFields = userFields.filter(field => 
        field.toLowerCase().includes('avatar') || 
        field.toLowerCase().includes('image') || 
        field.toLowerCase().includes('photo') || 
        field.toLowerCase().includes('logo')
      );
      
      if (avatarFields.length > 0) {
        console.log('📸 Campos de avatar/imagem em users:', avatarFields);
        avatarFields.forEach(field => {
          console.log(`   - ${field}: ${usersData[0][field] || 'null'}`);
        });
      } else {
        console.log('❌ Nenhum campo de avatar encontrado em users');
      }
    } else {
      console.log('⚠️ Tabela users está vazia');
    }
    
    // 2. Analisar estrutura da tabela organizations
    console.log('\n2️⃣ Estrutura da tabela organizations:');
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError) {
      console.error('❌ Erro ao consultar organizations:', orgsError);
    } else if (orgsData.length > 0) {
      const orgFields = Object.keys(orgsData[0]);
      console.log('✅ Campos da tabela organizations:', orgFields);
      
      // Verificar campos relacionados a avatar/imagem/logo
      const logoFields = orgFields.filter(field => 
        field.toLowerCase().includes('avatar') || 
        field.toLowerCase().includes('image') || 
        field.toLowerCase().includes('photo') || 
        field.toLowerCase().includes('logo')
      );
      
      if (logoFields.length > 0) {
        console.log('🏢 Campos de logo/imagem em organizations:', logoFields);
        logoFields.forEach(field => {
          console.log(`   - ${field}: ${orgsData[0][field] || 'null'}`);
        });
      } else {
        console.log('❌ Nenhum campo de logo encontrado em organizations');
      }
    } else {
      console.log('⚠️ Tabela organizations está vazia');
    }
    
    // 3. Verificar dados reais de um usuário específico
    console.log('\n3️⃣ Dados reais do usuário:');
    const testUserId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (userDataError) {
      console.error('❌ Erro ao buscar dados do usuário:', userDataError);
    } else {
      console.log('✅ Dados do usuário encontrado:');
      console.log('   - ID:', userData.id);
      console.log('   - Nome:', userData.full_name);
      console.log('   - Avatar URL:', userData.avatar_url || 'null');
      console.log('   - Outros campos de imagem:', Object.keys(userData).filter(k => 
        k.toLowerCase().includes('avatar') || 
        k.toLowerCase().includes('image') || 
        k.toLowerCase().includes('photo') || 
        k.toLowerCase().includes('logo')
      ));
    }
    
    // 4. Verificar dados reais da organização
    console.log('\n4️⃣ Dados reais da organização:');
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    const { data: orgData, error: orgDataError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', testOrgId)
      .single();
    
    if (orgDataError) {
      console.error('❌ Erro ao buscar dados da organização:', orgDataError);
    } else {
      console.log('✅ Dados da organização encontrados:');
      console.log('   - ID:', orgData.id);
      console.log('   - Nome:', orgData.name);
      console.log('   - Company Name:', orgData.company_name);
      console.log('   - Logo URL:', orgData.logo_url || 'null');
      console.log('   - Company Logo URL:', orgData.company_logo_url || 'null');
      console.log('   - Outros campos de imagem:', Object.keys(orgData).filter(k => 
        k.toLowerCase().includes('avatar') || 
        k.toLowerCase().includes('image') || 
        k.toLowerCase().includes('photo') || 
        k.toLowerCase().includes('logo')
      ));
    }
    
    // 5. Verificar bucket de storage
    console.log('\n5️⃣ Verificando bucket de storage:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      console.log('✅ Buckets disponíveis:', buckets.map(b => b.name));
      
      const avatarsBucket = buckets.find(b => b.name === 'avatars');
      if (avatarsBucket) {
        console.log('📁 Bucket avatars encontrado:', {
          id: avatarsBucket.id,
          name: avatarsBucket.name,
          public: avatarsBucket.public,
          fileSizeLimit: avatarsBucket.file_size_limit,
          allowedMimeTypes: avatarsBucket.allowed_mime_types
        });
        
        // Listar alguns arquivos do bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('avatars')
          .list('', { limit: 10 });
        
        if (filesError) {
          console.log('⚠️ Erro ao listar arquivos:', filesError.message);
        } else {
          console.log('📄 Arquivos no bucket avatars:', files.length);
          files.forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
        }
      }
    }
    
    // 6. Resumo da estrutura
    console.log('\n6️⃣ Resumo da estrutura de avatars:');
    console.log('👤 Avatar pessoal (usuário):');
    console.log('   - Tabela: users');
    console.log('   - Campo: avatar_url');
    console.log('   - Storage: bucket "avatars"');
    console.log('   - Path: {userId}/avatar_{timestamp}.{ext}');
    
    console.log('\n🏢 Logo da empresa (organização):');
    console.log('   - Tabela: organizations');
    console.log('   - Campo: company_logo_url');
    console.log('   - Storage: bucket "avatars"');
    console.log('   - Path: {userId}/company_logo_{timestamp}.{ext}');
    
    console.log('\n📋 Campos adicionais encontrados:');
    console.log('   - organizations.logo_url (pode ser diferente de company_logo_url)');
    console.log('   - organizations.logo_text (texto do logo)');
    
    console.log('\n🎉 Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
analyzeAvatarStructure();
