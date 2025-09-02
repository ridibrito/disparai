import { createServerClient } from '@/lib/supabaseServer';
import { ContactsTabs } from '@/components/contacts/contacts-tabs';
import Link from 'next/link';

export const metadata = {
  title: 'Contatos - disparai',
  description: 'Gerencie suas listas de contatos',
};

export default async function ContatosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';
  const currentOrgId = userId;
  const remainingContacts = 1000;

  // Buscar contatos do usuário
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false });

  // Buscar listas
  const { data: lists } = await supabase
    .from('contact_lists')
    .select('id, name, created_at')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contatos</h1>
        <p className="text-gray-600">Gerencie suas listas de contatos para envio de mensagens.</p>
      </div>

      <ContactsTabs userId={userId} contacts={(contacts as any) || []} lists={(lists as any) || []} remainingContacts={remainingContacts} />
    </div>
  );
}
