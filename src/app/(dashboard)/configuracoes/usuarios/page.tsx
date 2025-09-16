import { createServerClient } from '@/lib/supabaseServer';
import { MembersTable } from '@/components/organization/members-table';
import { BackButton } from '@/components/ui/back-button';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Usuários - Configurações - disparai',
  description: 'Gerencie os membros da organização',
};

export default async function UsuariosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // Buscar a organização do usuário logado
  let currentOrgId = userId; // Fallback para compatibilidade
  let organizationInfo: any = null;
  
  try {
    // Primeiro, tentar buscar a organização do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!userError && userData && (userData as any).organization_id) {
      currentOrgId = (userData as any).organization_id;
      
      // Buscar informações da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name, company_name, owner_name, owner_email, company_logo_url')
        .eq('id', currentOrgId)
        .single();
        
      if (!orgError && orgData) {
        organizationInfo = orgData;
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar organização, usando fallback:', currentOrgId);
  }

  // Verificar se o usuário logado tem permissão para ver esta página
  const { data: currentUserRole } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', currentOrgId)
    .single();

  const userRole = (currentUserRole as any)?.role;
  
  // Apenas owner e admin podem ver esta página
  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          <p className="text-sm text-gray-500 mt-2">Apenas proprietários e administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  console.log(`🔐 Usuário logado tem role: ${userRole}`);

  // Buscar membros da organização
  const { data: memberRows, error: memberError } = await supabase
    .from('organization_members')
    .select('user_id, role, is_active')
    .eq('organization_id', currentOrgId);

  if (memberError) {
    console.error('❌ Erro ao buscar membros:', memberError);
  }

  // Buscar dados dos usuários separadamente
  let membersWithUserData: any[] = [];
  let allUsers: any[] = [];
  
  if (memberRows && Array.isArray(memberRows)) {
    // Buscar todos os usuários de uma vez
    const userIds = memberRows.map((m: any) => m.user_id);
    
    for (const userId of userIds) {
      // Se o usuário logado é owner/admin, usar query direta para contornar RLS
      if (userRole === 'owner' || userRole === 'admin') {
        try {
          // Primeiro, verificar se o usuário existe usando uma query mais específica
          const { data: checkData, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .limit(1);
          
          console.log(`🔍 Verificação de existência para ${userId}:`, { checkData, checkError });
          
          if (checkData && checkData.length > 0) {
            // Usuário existe, agora buscar dados completos
            const { data: fullData, error: fullError } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', userId)
              .limit(1);
            
            console.log(`🔍 Busca de dados completos para ${userId}:`, { fullData, fullError });
            
            if (fullData && fullData.length > 0) {
              allUsers.push(fullData[0]);
              console.log(`✅ Usuário encontrado via verificação + busca: ${userId} - ${(fullData[0] as any).full_name}`);
            } else {
              throw new Error(`Falha ao buscar dados completos: ${fullError?.message || 'Erro desconhecido'}`);
            }
          } else {
            // Usuário não existe na tabela users
            console.log(`⚠️ Usuário ${userId} não encontrado na tabela users`);
            
            // Tentar buscar em outras tabelas relacionadas
            const tablesToCheck = ['profiles', 'user_profiles', 'auth_users', 'organization_members'];
            let userFound = false;
            
            for (const tableName of tablesToCheck) {
              try {
                console.log(`🔍 Tentando buscar em ${tableName} para ${userId}...`);
                
                const { data: tableData, error: tableError } = await supabase
                  .from(tableName)
                  .select('*')
                  .eq('id', userId)
                  .limit(1);
                
                console.log(`🔍 Resultado de ${tableName}:`, { tableData, tableError });
                
                if (tableData && tableData.length > 0) {
                  const userData = tableData[0] as any;
                  // Mapear campos comuns
                  const mappedUser = {
                    id: userData.id,
                    full_name: userData.full_name || userData.name || userData.display_name || `Usuário ${userId.substring(0, 8)}...`,
                    avatar_url: userData.avatar_url || userData.avatar || null
                  };
                  
                  allUsers.push(mappedUser);
                  console.log(`✅ Usuário encontrado em ${tableName}: ${userId} - ${mappedUser.full_name}`);
                  userFound = true;
                  break;
                }
              } catch (tableError) {
                console.log(`⚠️ Erro ao buscar em ${tableName}:`, tableError);
                continue;
              }
            }
            
            if (!userFound) {
              // Criar placeholder como último recurso
              allUsers.push({
                id: userId,
                full_name: `Usuário ${userId.substring(0, 8)}...`,
                avatar_url: null
              });
              console.log(`⚠️ Placeholder criado para ${userId} - usuário não encontrado em nenhum lugar`);
              console.log(`❌ checkError:`, checkError);
              console.log(`🚨 PROBLEMA CRÍTICO: Usuário ${userId} não existe no sistema!`);
              console.log(`🚨 Ele está listado como membro da organização, mas nunca foi criado como usuário real.`);
              console.log(`🚨 Isso indica um bug no processo de criação de usuários.`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar usuário ${userId}:`, error);
          // Criar placeholder em caso de erro
          allUsers.push({
            id: userId,
            full_name: `Usuário ${userId.substring(0, 8)}...`,
            avatar_url: null
          });
        }
      } else {
        // Usuários sem permissão não devem chegar aqui
        console.log(`❌ Usuário ${userId} sem permissão para acessar dados`);
      }
    }
  }

  // Combinar os dados
  if (memberRows && Array.isArray(memberRows)) {
    memberRows.forEach((member: any) => {
      const userData = allUsers.find((u: any) => u.id === member.user_id);
      
      if (userData) {
        membersWithUserData.push({
          ...member,
          users: userData
        });
        
        // Log simples para verificar os nomes
        console.log(`✅ Membro: ${member.role} - Nome: ${userData.full_name}`);
      }
    });
  }

  // 🚀 DESENVOLVIMENTO: Plano Empresarial como padrão
  const currentUsersCount = (membersWithUserData || []).length;
  const userLimit = 5; // Plano Empresarial: 5 usuários
  const planName = 'Empresarial';

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
          <p className="text-gray-600">Gerencie os membros da sua organização.</p>
        </div>
        <BackButton />
      </div>
        
        {/* Informações da Empresa */}
        {organizationInfo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                {organizationInfo.company_logo_url ? (
                  <Image 
                    src={organizationInfo.company_logo_url} 
                    alt="Logo da empresa" 
                    width={40} 
                    height={40} 
                    className="w-10 h-10 object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg font-bold">
                      {organizationInfo.company_name?.charAt(0) || 'E'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {organizationInfo.company_name || organizationInfo.name}
                </h3>
                <p className="text-sm text-blue-700">
                  👑 Proprietário: {organizationInfo.owner_name}
                  {organizationInfo.owner_email && ` (${organizationInfo.owner_email})`}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Informações do Plano e Limites */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Plano:</span> {planName}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Usuários:</span> {currentUsersCount}/{userLimit}
            </div>
            {currentUsersCount >= userLimit && (
              <div className="text-sm text-red-600 font-medium">
                • Limite atingido
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Membros */}
      <div className="bg-white rounded-lg shadow p-6">
        <MembersTable 
          initialMembers={membersWithUserData || []} 
          organizationId={currentOrgId}
          userLimit={userLimit}
          currentUsersCount={currentUsersCount}
        />
      </div>
    </div>
  );
}


