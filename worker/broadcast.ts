import 'dotenv/config';
import { boss, ensureBoss } from '../src/server/boss';
import { sendTemplate, sendText } from '../src/lib/whatsapp';
import { supabaseAdmin } from '../src/lib/supabase';
import { isSessionOpen } from '../src/lib/session';

async function canSendText(e164: string) {
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, opt_in_status, tenant_id')
    .eq('wa_phone_e164', e164)
    .maybeSingle();

  if (!contact || contact.opt_in_status === 'revoked') return false;

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, session_expires_at')
    .eq('contact_id', contact.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return isSessionOpen(conv?.session_expires_at);
}

async function main() {
  await ensureBoss();

  await boss.work('broadcast:send', async (job) => {
    const { to, kind, template, text } = job.data as any;

    try {
      if (kind === 'template') {
        if (!template?.name) throw new Error('Template inválido');
        await sendTemplate(
          to,
          template.name,
          template.language || 'pt_BR',
          template.components || []
        );
      } else if (kind === 'text') {
        if (!text) throw new Error('Texto vazio');
        const ok = await canSendText(to);
        if (!ok) throw new Error('Janela 24h fechada ou opt-out; use template');
        await sendText(to, text);
      }

      return { status: 'sent' };
    } catch (e: any) {
      console.error('broadcast:send error', e?.response?.data || e);
      throw e;
    }
  });

  console.log('[worker] broadcast online');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
