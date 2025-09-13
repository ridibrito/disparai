import { ProfileFormWrapper } from '@/components/profile/profile-form-wrapper';
import { createServerClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'Perfil - Configurações - disparai',
  description: 'Gerencie suas informações pessoais',
};

export default async function PerfilPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || '';
  const userEmail = session?.user?.email || '';
  
  // Buscar dados do usuário
  const { data: initial } = await supabase
    .from('users')
    .select('full_name, avatar_url, bio, phone')
    .eq('id', userId)
    .single();

  // Buscar dados da organização/empresa
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', userId)
    .single();

  // Buscar role do usuário na organização
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organization?.id)
    .single();

  // Verificar se o usuário é admin ou owner
  const userRole = memberData?.role;
  const canEditCompany = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e dados da empresa.</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <ProfileFormWrapper 
          userId={userId} 
          userEmail={userEmail} 
          initialData={initial}
          organizationData={organization}
          canEditCompany={canEditCompany}
        />
      </div>
    </div>
  );
}
