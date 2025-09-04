import { createServerClient } from '@/lib/supabaseServer';
import { DisparoForm } from '@/components/disparos/disparo-form';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Novo Disparo - disparai',
  description: 'Crie um novo disparo de mensagens',
};

export default async function NovoDisparoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Disparo</h1>
          <p className="text-gray-600">Crie um novo disparo de mensagens em massa.</p>
        </div>
      </div>

      {/* Disparo Form */}
      <div className="max-w-2xl">
        <DisparoForm userId={user.id} />
      </div>
    </div>
  );
}