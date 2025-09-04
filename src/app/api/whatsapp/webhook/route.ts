import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { runAI } from '@/lib/ai';
import { sendText } from '@/lib/whatsapp';
import { getConnectionByPhoneNumber, logConnectionUsage } from '@/lib/connection-utils';
import type { WhatsAppIncoming } from '@/types/whatsapp';
import { upsertContactByE164, isOptedOut, registerOptOut } from '@/lib/contacts';
import { ensureConversation, isSessionOpen, renewSession } from '@/lib/session';
import { persistIncomingMessage, persistOutgoingMessage } from '@/lib/messages';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // TODO: recuperar por phone_number_id → tenant

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.meta.verifyToken) {
    return new NextResponse(challenge || 'OK', { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as WhatsAppIncoming;

    // Log do webhook para auditoria
    await supabaseAdmin.from('events_raw').insert({ payload });

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const v = change.value;

        if (v.messages && v.messages.length > 0) {
          // Obter conexão ativa baseada no phone_number_id
          const connection = await getConnectionByPhoneNumber(v.metadata.phone_number_id);
          
          if (!connection) {
            console.warn(`No active connection found for phone_number_id: ${v.metadata.phone_number_id}`);
            continue;
          }

          // Log do webhook recebido
          await logConnectionUsage(
            connection.id,
            'webhook_received',
            true,
            0,
            null,
            { message_count: v.messages.length }
          );

          for (const m of v.messages) {
            const fromMsisdn = m.from; // E164 sem +
            const e164 = `+${fromMsisdn}`;
            const text =
              m.text?.body ||
              m.interactive?.list_reply?.title ||
              m.interactive?.button_reply?.title ||
              '';

            // Opt-out
            if (/(sair|stop|cancelar)/i.test(text)) {
              await registerOptOut(e164);
              await sendText(
                e164,
                'Tudo bem, você foi removido da nossa lista. Se mudar de ideia, é só nos avisar. 🙂',
                connection.user_id,
                connection.type
              );
              continue;
            }

            // Verificar se o usuário optou out
            if (await isOptedOut(e164)) continue;

            // Contato + conversa + sessão
            const contact = await upsertContactByE164(TENANT_ID, e164);
            const conv = await ensureConversation(TENANT_ID, contact.id);
            await renewSession(conv.id);

            // Persistir mensagem
            await persistIncomingMessage(conv.id, m);

            // IA
            const ai = await runAI({ messages: [{ role: 'user', content: text }] });
            if (ai.reply) {
              try {
                const res = await sendText(e164, ai.reply, connection.user_id, connection.type);
                await persistOutgoingMessage(
                  conv.id,
                  'text',
                  { body: ai.reply },
                  res?.messages?.[0]?.id
                );

                // Log do envio bem-sucedido
                await logConnectionUsage(
                  connection.id,
                  'send_message',
                  true,
                  1,
                  null,
                  { message_type: 'text', recipient: e164 }
                );
              } catch (error: any) {
                console.error('Error sending message:', error);
                
                // Log do erro
                await logConnectionUsage(
                  connection.id,
                  'send_message',
                  false,
                  0,
                  error.message,
                  { message_type: 'text', recipient: e164 }
                );
              }
            }

            // Se precisar de handoff humano
            if (ai.handoff) {
              await supabaseAdmin
                .from('handoffs')
                .insert({ conversation_id: conv.id, status: 'waiting' });
            }
          }
        }

        if (v.statuses && v.statuses.length > 0) {
          // TODO: atualizar status em messages/campaign_targets
          console.log('Status updates:', v.statuses);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
