import { addHours, isAfter } from 'date-fns';
import { supabaseAdmin } from './supabase';

export async function ensureConversation(tenantId: string, contactId: string) {
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conv) return conv;

  const { data: created, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
      status: 'open',
      session_expires_at: addHours(new Date(), 24).toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return created;
}

export function isSessionOpen(session_expires_at?: string | null) {
  if (!session_expires_at) return false;
  return isAfter(new Date(session_expires_at), new Date());
}

export async function renewSession(conversationId: string) {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ session_expires_at: addHours(new Date(), 24).toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}
