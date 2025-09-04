import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureBoss } from '@/server/boss';
import { supabaseAdmin } from '@/lib/supabase';

const bodySchema = z.object({
  kind: z.enum(['template', 'text']),
  to: z.array(z.string().regex(/^\+/)).min(1),
  template: z
    .object({
      name: z.string(),
      language: z.string().default('pt_BR'),
      components: z.array(z.any()).default([]),
    })
    .optional(),
  text: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = bodySchema.parse(await req.json());
    const boss = await ensureBoss();

    // Se for TEXT, a responsabilidade de checar a janela é do worker (pois é por-contato)
    const jobs = data.to.map((to, idx) => ({
      name: 'broadcast:send',
      data: {
        to,
        kind: data.kind,
        template: data.template,
        text: data.text,
        campaignId: data.campaignId,
      },
      options: {
        startAfter: `${6 * idx} seconds`, // Rate limit: 1 msg a cada 6s por contato
        retryLimit: 5,
        retryBackoff: true,
      },
    }));

    await boss.insert(jobs);

    return NextResponse.json({ queued: jobs.length });
  } catch (error) {
    console.error('Send API error:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
