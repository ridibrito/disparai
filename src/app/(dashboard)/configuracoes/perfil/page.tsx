import { ProfileForm } from '@/components/profile/profile-form';
import { createServerClient } from '@/lib/supabaseServer';

export const metadata = {
  title: 'Perfil - Configurações - DisparaMaker',
  description: 'Gerencie suas informações pessoais',
};

export default async function PerfilPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || '';
  const userEmail = session?.user?.email || '';
  const { data: initial } = await supabase.from('users').select('full_name').eq('id', userId).single();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e preferências.</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <ProfileForm userId={userId} userEmail={userEmail} initialData={initial} />
      </div>
    </div>
  );
}
