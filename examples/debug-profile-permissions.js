// Script para diagnosticar problemas de permissão no perfil
// Execute: node examples/debug-profile-permissions.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfilePermissions() {
  try {
    console.log('🔍 Diagnosticando problemas de permissão no perfil...\n');
    
    // 1. Listar todos os usuários
    console.log('1️⃣ Listando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .limit(10);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log('✅ Usuários encontrados:');
      users.forEach(user => {
        console.log(`   - ${user.full_name} (${user.email}) - Org: ${user.organization_id}`);
      });
    }
    
    // 2. Listar organizações
    console.log('\n2️⃣ Listando organizações...');
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, company_name, owner_id')
      .limit(10);
    
    if (orgsError) {
      console.log('❌ Erro ao buscar organizações:', orgsError);
    } else {
      console.log('✅ Organizações encontradas:');
      organizations.forEach(org => {
        console.log(`   - ${org.name || org.company_name} (ID: ${org.id}) - Owner: ${org.owner_id}`);
      });
    }
    
    // 3. Listar membros das organizações
    console.log('\n3️⃣ Listando membros das organizações...');
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .limit(20);
    
    if (membersError) {
      console.log('❌ Erro ao buscar membros:', membersError);
    } else {
      console.log('✅ Membros encontrados:');
      members.forEach(member => {
        console.log(`   - User: ${member.user_id} | Org: ${member.organization_id} | Role: ${member.role}`);
      });
    }
    
    // 4. Verificar estrutura das tabelas
    console.log('\n4️⃣ Verificando estrutura das tabelas...');
    
    // Verificar se a tabela organizations tem os campos necessários
    const { data: orgSample, error: orgSampleError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgSampleError) {
      console.log('❌ Erro ao verificar estrutura da tabela organizations:', orgSampleError);
    } else if (orgSample && orgSample.length > 0) {
      console.log('✅ Campos disponíveis na tabela organizations:');
      const fields = Object.keys(orgSample[0]);
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof orgSample[0][field]}`);
      });
    }
    
    // 5. Verificar se há dados de empresa
    console.log('\n5️⃣ Verificando dados de empresa...');
    const { data: orgData, error: orgDataError } = await supabase
      .from('organizations')
      .select('id, company_name, company_description, company_website, company_sector, company_phone, company_email, company_address, company_city, company_state, company_zip_code, company_country')
      .not('company_name', 'is', null)
      .limit(5);
    
    if (orgDataError) {
      console.log('❌ Erro ao buscar dados de empresa:', orgDataError);
    } else {
      console.log('✅ Dados de empresa encontrados:');
      orgData.forEach(org => {
        console.log(`   - ${org.company_name || 'Sem nome'}`);
        console.log(`     Descrição: ${org.company_description || 'N/A'}`);
        console.log(`     Website: ${org.company_website || 'N/A'}`);
        console.log(`     Setor: ${org.company_sector || 'N/A'}`);
        console.log(`     Telefone: ${org.company_phone || 'N/A'}`);
        console.log(`     Email: ${org.company_email || 'N/A'}`);
        console.log(`     Endereço: ${org.company_address || 'N/A'}`);
        console.log(`     Cidade: ${org.company_city || 'N/A'}`);
        console.log(`     Estado: ${org.company_state || 'N/A'}`);
        console.log(`     CEP: ${org.company_zip_code || 'N/A'}`);
        console.log(`     País: ${org.company_country || 'N/A'}`);
        console.log('');
      });
    }
    
    // 6. Verificar RLS (Row Level Security)
    console.log('\n6️⃣ Verificando políticas RLS...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'organizations' })
      .catch(() => ({ data: null, error: { message: 'Função não disponível' } }));
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar políticas RLS:', rlsError.message);
    } else {
      console.log('✅ Políticas RLS encontradas:', rlsPolicies);
    }
    
    console.log('\n🎉 Diagnóstico concluído!');
    console.log('\n💡 Possíveis problemas identificados:');
    console.log('   1. Usuário não tem role de owner/admin na organização');
    console.log('   2. Tabela organizations não tem os campos necessários');
    console.log('   3. Políticas RLS impedem a edição');
    console.log('   4. Dados da organização não existem');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
debugProfilePermissions();
