import { createServerClient } from '@/lib/supabaseServer';
import { ContactsTable } from '@/components/contacts/contacts-table';
import { ContactImportForm } from '@/components/contacts/contact-import-form';

export const metadata = {
  title: 'Contatos - DisparaMaker',
  description: 'Gerencie suas listas de contatos',
};

export default async function ContatosPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || '';
  const currentOrgId = userId;
  const remainingContacts = 1000;

  // Buscar contatos do usuário
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contatos</h1>
        <p className="text-gray-600">Gerencie suas listas de contatos para envio de mensagens.</p>
      </div>

      {/* Import Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Importar Contatos</h2>
        <ContactImportForm userId={userId} remainingContacts={remainingContacts} />
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Contatos</h2>
        </div>
        <ContactsTable initialContacts={(contacts as any) || []} userId={userId} />
      </div>
    </div>
  );
}
