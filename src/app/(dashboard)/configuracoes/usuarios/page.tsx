import { createServerClient } from '@/lib/supabaseServer';
import { MembersTable } from '@/components/organization/members-table';

export const metadata = {
  title: 'Usuários - Configurações - DisparaMaker',
  description: 'Gerencie os membros da organização',
};

export default async function UsuariosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';
  const currentOrgId = userId;

  const { data: rows } = await supabase
    .from('organization_members')
    .select('user_id, role, users ( full_name, avatar_url, id )')
    .eq('organization_id', currentOrgId);

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
        <p className="text-gray-600">Gerencie os membros da sua organização.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <MembersTable initialMembers={(rows as any) || []} organizationId={currentOrgId} />
      </div>
    </div>
  );
}


