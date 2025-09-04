import { supabaseAdmin } from './supabase';

export async function persistIncomingMessage(conversationId: string, payload: any) {
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    direction: 'in',
    type: payload.type || 'text',
    payload,
    status: 'delivered',
  });
}

export async function persistOutgoingMessage(
  conversationId: string,
  type: string,
  payload: any,
  wa_msg_id?: string
) {
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    direction: 'out',
    type,
    payload,
    wa_msg_id,
    status: 'sent',
  });
}
