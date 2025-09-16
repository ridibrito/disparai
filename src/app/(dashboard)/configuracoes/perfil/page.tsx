import { ProfileFormWrapper } from '@/components/profile/profile-form-wrapper';
import { createServerClient } from '@/lib/supabaseServer';
import { BackButton } from '@/components/ui/back-button';

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

  // Buscar dados da organização/empresa considerando vínculo do usuário
  let organization = null;
  let memberData: { organization_id: string; role: string } | null = null;
  let userRole: string | null = null;
  let canEditCompany = false;

  if (userId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membership?.organization_id) {
      const { data: memberOrganization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .maybeSingle();

      if (memberOrganization) {
        organization = memberOrganization;
        memberData = membership;
        userRole = membership.role;
        canEditCompany = userRole === 'owner' || userRole === 'admin';
      }
    }
  }

  if (!organization) {
    const { data: ownedOrganization } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (ownedOrganization) {
      organization = ownedOrganization;
      userRole = 'owner';
      canEditCompany = true;
    }
  }

  if (!organization) {
    // Se não há organização vinculada, criar uma automaticamente
    console.log('⚠️ Organização não encontrada, criando uma nova...');

    const { data: newOrganization, error: createError } = await supabase
      .from('organizations')
      .insert({
        owner_id: userId,
        name: initial?.full_name || 'Minha Empresa',
        company_name: initial?.full_name || 'Minha Empresa',
        company_country: 'Brasil',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar organização:', createError);
      // Mesmo com erro, permitir edição
      canEditCompany = true;
      userRole = 'owner';
    } else {
      console.log('✅ Organização criada:', newOrganization);
      organization = newOrganization;
      canEditCompany = true;
      userRole = 'owner';
    }
  }

  console.log('=== DEBUG PERFIL PAGE ===');
  console.log('User ID:', userId);
  console.log('Organization:', organization);
  console.log('Member data:', memberData);
  console.log('User role:', userRole);
  console.log('Can edit company:', canEditCompany);
  console.log('========================');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e dados da empresa.</p>
        </div>
        <BackButton />
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
