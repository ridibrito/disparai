// Script para corrigir a URL do logo da empresa no banco de dados
// Execute: node examples/fix-company-logo-url.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixCompanyLogoUrl() {
  try {
    console.log('🔧 Corrigindo URL do logo da empresa no banco de dados...\n');
    
    const testOrgId = '596274e5-69c9-4267-975d-18f6af63c9b2';
    
    // 1. Verificar situação atual
    console.log('1️⃣ Verificando situação atual...');
    const { data: currentOrg, error: currentError } = await supabase
      .from('organizations')
      .select('company_logo_url')
      .eq('id', testOrgId)
      .single();
    
    if (currentError) {
      console.error('❌ Erro ao buscar organização:', currentError);
      return;
    }
    
    console.log('📋 URL atual no banco:', currentOrg.company_logo_url);
    
    // 2. Listar arquivos disponíveis no storage
    console.log('\n2️⃣ Verificando arquivos disponíveis no storage...');
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list(testOrgId, { limit: 10 });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
      return;
    }
    
    const logoFiles = files.filter(f => f.name.includes('company_logo_'));
    console.log(`📁 Encontrados ${logoFiles.length} logos da empresa:`);
    logoFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.created_at})`);
    });
    
    if (logoFiles.length === 0) {
      console.log('❌ Nenhum logo da empresa encontrado no storage');
      return;
    }
    
    // 3. Encontrar o arquivo mais recente
    const latestLogo = logoFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    console.log(`\n3️⃣ Logo mais recente: ${latestLogo.name}`);
    
    // 4. Gerar nova URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${testOrgId}/${latestLogo.name}`);
    
    const newLogoUrl = urlData.publicUrl;
    console.log(`🔗 Nova URL: ${newLogoUrl}`);
    
    // 5. Verificar se a nova URL é diferente da atual
    if (currentOrg.company_logo_url === newLogoUrl) {
      console.log('✅ URL já está correta, nenhuma correção necessária');
      return;
    }
    
    // 6. Atualizar o banco de dados
    console.log('\n4️⃣ Atualizando banco de dados...');
    const { data: updateData, error: updateError } = await supabase
      .from('organizations')
      .update({
        company_logo_url: newLogoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrgId)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar organização:', updateError);
      return;
    }
    
    console.log('✅ Organização atualizada com sucesso!');
    console.log('📋 Nova URL no banco:', updateData[0].company_logo_url);
    
    // 7. Verificar se a atualização foi bem-sucedida
    console.log('\n5️⃣ Verificando atualização...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('organizations')
      .select('company_logo_url, updated_at')
      .eq('id', testOrgId)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar atualização:', verifyError);
      return;
    }
    
    console.log('✅ Verificação concluída:');
    console.log(`   URL: ${verifyData.company_logo_url}`);
    console.log(`   Atualizado em: ${verifyData.updated_at}`);
    
    // 8. Testar acessibilidade da nova URL
    console.log('\n6️⃣ Testando acessibilidade da nova URL...');
    try {
      const response = await fetch(newLogoUrl, { method: 'HEAD' });
      console.log(`✅ URL acessível: ${response.ok ? 'Sim' : 'Não'} (${response.status})`);
    } catch (error) {
      console.log(`❌ Erro ao testar URL: ${error.message}`);
    }
    
    console.log('\n🎉 Correção da URL do logo da empresa concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
fixCompanyLogoUrl();
