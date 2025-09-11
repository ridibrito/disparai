import { createServerClient } from '@/lib/supabaseServer';
import TemplatesManagerUnified from '@/components/templates/TemplatesManagerUnified';

export const metadata = {
  title: 'Templates - Configurações - disparai',
  description: 'Gerencie seus templates de mensagem personalizados',
};

export default async function TemplatesConfigPage() {
  return <TemplatesManagerUnified />;
}
