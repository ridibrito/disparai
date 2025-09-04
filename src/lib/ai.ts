import OpenAI from 'openai';
import { env } from './env';

const client = new OpenAI({ apiKey: env.openai.apiKey });

export type AIResult = {
  intent: string;
  confidence: number;
  reply?: string;
  handoff?: boolean;
};

const SYSTEM_PROMPT = `Você é um agente de atendimento da Coruss no WhatsApp. Seja objetivo, educado e útil.

Regras:
- Mensagens curtas, 1 pergunta por vez.
- Se identificar intenção de agendamento, ofereça 2-3 horários.
- Se houver dúvida sobre preços, colete informações essenciais antes.
- Se o usuário pedir para parar, responda confirmando e não escreva novamente.
- Use linguagem natural e amigável.
- Sempre responda em português do Brasil.`;

export async function runAI(input: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: any;
}): Promise<AIResult> {
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...input.messages,
    ];

    const completion = await client.chat.completions.create({
      model: env.openai.model,
      messages,
      temperature: env.openai.temperature,
      max_tokens: 400,
    });

    const text = completion.choices[0]?.message?.content?.trim() || 'Como posso ajudar?';

    // Heurística simples de intenção
    const low = text.toLowerCase();
    if (/(agend|agenda|horár|reuni|marcar)/.test(low)) {
      return { intent: 'schedule', confidence: 0.8, reply: text };
    }
    if (/(preço|custo|valor|quanto)/.test(low)) {
      return { intent: 'pricing', confidence: 0.7, reply: text };
    }
    if (/(atendente|humano|falar|pessoa)/.test(low)) {
      return { intent: 'handoff', confidence: 0.9, reply: text, handoff: true };
    }

    return { intent: 'qa', confidence: 0.6, reply: text };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      reply: 'Desculpe, tive um problema técnico. Um humano vai assumir o atendimento.',
      intent: 'handoff',
      confidence: 0.1,
      handoff: true,
    };
  }
}
