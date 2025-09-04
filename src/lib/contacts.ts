import { supabaseAdmin } from './supabase';

export async function upsertContactByE164(tenantId: string, e164: string, name?: string) {
  const { data: existing } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('wa_phone_e164', e164)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .insert({
      tenant_id: tenantId,
      wa_phone_e164: e164,
      name,
      opt_in_status: 'granted',
      opt_in_source: 'whatsapp_message',
      opt_in_ts: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function registerOptOut(e164: string) {
  await supabaseAdmin
    .from('contacts')
    .update({
      opt_in_status: 'revoked',
      opt_out_ts: new Date().toISOString(),
    })
    .eq('wa_phone_e164', e164);
}

export async function isOptedOut(e164: string) {
  const { data } = await supabaseAdmin
    .from('contacts')
    .select('opt_in_status')
    .eq('wa_phone_e164', e164)
    .maybeSingle();

  return data?.opt_in_status === 'revoked';
}
