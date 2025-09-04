import { createServerClient } from '@/lib/supabaseServer';
import { ConversationsPageWithUser } from '@/components/conversations/conversations-page-with-user';

export const metadata = {
  title: 'Conversas - disparai',
  description: 'Gerencie suas conversas de WhatsApp',
};

export default async function ConversasPage() {
  return <ConversationsPageWithUser />;
}