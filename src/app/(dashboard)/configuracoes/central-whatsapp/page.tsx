import { createServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { CentralWhatsAppClient } from '@/components/whatsapp/central-whatsapp-client';

export const metadata = {
  title: 'Central WhatsApp - Configurações - disparai',
  description: 'Gerencie todas as instâncias WhatsApp em um só lugar',
};

export default async function CentralWhatsAppPage() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Buscar informações da organização
  let organizationInfo: any = null;
  let currentOrgId = user.id;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userData?.organization_id) {
      currentOrgId = userData.organization_id;
      
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, company_name, owner_name, company_logo_url')
        .eq('id', currentOrgId)
        .single();
        
      if (orgData) {
        organizationInfo = orgData;
      }
    }
  } catch (error) {
    console.log('Erro ao buscar organização:', error);
  }

  // Buscar instâncias ativas do usuário
  const { data: instances, error: instancesError } = await supabase
    .from('api_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('type', ['whatsapp_disparai', 'whatsapp_cloud'])
    .order('created_at', { ascending: false });

  if (instancesError) {
    console.error('Erro ao buscar instâncias:', instancesError);
  }

  const activeInstances = instances || [];

  return (
    <CentralWhatsAppClient 
      activeInstances={activeInstances}
      organizationInfo={organizationInfo}
    />
  );
}