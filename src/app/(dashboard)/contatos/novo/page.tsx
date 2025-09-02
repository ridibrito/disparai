import { createServerClient } from '@/lib/supabaseServer';
import { ContactForm } from '@/components/contacts/contact-form';

export const metadata = {
  title: 'Novo Contato - disparai',
};

export default async function ContatosNovoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Novo contato</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700">
        <ContactForm userId={userId} />
      </div>
    </div>
  );
}


