import { createServerClient } from '@/lib/supabaseServer';
import ConversationsPageReal from '@/components/conversations/conversations-page-real';

export const metadata = {
  title: 'Conversas - disparai',
  description: 'Gerencie suas conversas de WhatsApp',
};

export default async function ConversasPage() {
  return <ConversationsPageReal />;
}