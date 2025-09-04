import { createServerClient } from '@/lib/supabaseServer';
import { DisparosActions } from '@/components/dashboard/disparos-actions';
import { CampaignsTable } from '@/components/dashboard/campaigns-table';
import { DisparosPageWithRefresh } from '@/components/disparos/disparos-page-with-refresh';

export const metadata = {
  title: 'Disparos - disparai',
  description: 'Gerencie seus disparos de mensagens',
};

export default async function DisparosPage() {
  return <DisparosPageWithRefresh />;
}
