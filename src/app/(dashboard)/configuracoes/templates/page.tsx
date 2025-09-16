import { createServerClient } from '@/lib/supabaseServer';
import TemplatesManagerUnified from '@/components/templates/TemplatesManagerUnified';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Templates - Configurações - disparai',
  description: 'Gerencie seus templates de mensagem personalizados',
};

export default async function TemplatesConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600">Gerencie seus templates de mensagem personalizados</p>
        </div>
        <BackButton />
      </div>
      <TemplatesManagerUnified />
    </div>
  );
}
