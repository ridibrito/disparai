import OpenAI from 'openai';
import { env } from './env';
import { createCalendarEvent } from './google-calendar';
import { createRDStationDeal } from './rd-station';

const client = env.openai.apiKey ? new OpenAI({ apiKey: env.openai.apiKey }) : null;

export type AIResult = {
  intent: string;
  confidence: number;
  reply?: string;
  handoff?: boolean;
  qualification_status?: 'qualified' | 'unqualified' | 'pending';
  tool_calls?: Array<{ function: { name: string; arguments: string } }>;
};

const SYSTEM_PROMPT = `Você é um agente de atendimento da Coruss no WhatsApp. Seja objetivo, educado e útil.

Regras:
- Mensagens curtas, 1 pergunta por vez.
- Se identificar intenção de agendamento, ofereça 2-3 horários.
- Se houver dúvida sobre preços, colete informações essenciais antes.
- Se o usuário pedir para parar, responda confirmando e não escreva novamente.
- Use linguagem natural e amigável.
- Sempre responda em português do Brasil.

Você tem acesso a ferramentas para agendar reuniões e criar negócios no CRM. Use-as quando apropriado.`;

const tools = [
  {
    type: "function",
    function: {
      name: "createCalendarEvent",
      description: "Cria um evento no Google Calendar para agendar uma reunião.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Título da reunião.",
          },
          startDateTime: {
            type: "string",
            format: "date-time",
            description: "Data e hora de início da reunião no formato ISO 8601 (ex: 2024-12-25T09:00:00-03:00).",
          },
          endDateTime: {
            type: "string",
            format: "date-time",
            description: "Data e hora de término da reunião no formato ISO 8601 (ex: 2024-12-25T10:00:00-03:00).",
          },
          attendees: {
            type: "array",
            items: { type: "string", format: "email" },
            description: "Lista de emails dos participantes da reunião.",
          },
          description: {
            type: "string",
            description: "Descrição detalhada da reunião.",
          },
        },
        required: ["summary", "startDateTime", "endDateTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createRDStationDeal",
      description: "Cria uma nova negociação (deal) no RD Station CRM.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nome da negociação (ex: 'Novo Lead - [Nome do Contato]').",
          },
          deal_stage_id: {
            type: "string",
            description: "ID da etapa do funil onde a negociação será criada (ex: 'start', 'qualification').",
          },
          contact_email: {
            type: "string",
            format: "email",
            description: "Email do contato para vincular à negociação. O contato deve existir no RD Station.",
          },
          user_id: {
            type: "string",
            description: "ID do usuário proprietário da negociação no RD Station.",
          },
        },
        required: ["name", "deal_stage_id"],
      },
    },
  },
];

export async function runAI(
  input: {
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string; name?: string }>;
    context?: any;
  }
): Promise<AIResult> {
  try {
    // Verificar se o cliente OpenAI está disponível
    if (!client) {
      console.warn('OpenAI client not available - returning fallback response');
      return {
        reply: 'Desculpe, o serviço de IA não está disponível no momento. Um humano vai assumir o atendimento.',
        intent: 'handoff',
        confidence: 0.1,
        handoff: true,
        qualification_status: 'unqualified',
      };
    }

    let messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...input.messages,
    ];

    // Primeiro, tenta obter uma resposta com tool_calls
    let completion = await client.chat.completions.create({
      model: env.openai.model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: env.openai.temperature,
      max_tokens: 400,
    });

    const responseMessage = completion.choices[0]?.message;

    // Se a IA decidir chamar uma ferramenta
    if (responseMessage?.tool_calls) {
      const toolCalls = responseMessage.tool_calls;
      messages.push(responseMessage); // Adiciona a mensagem da IA com tool_calls

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let toolOutput: any;

        if (functionName === "createCalendarEvent") {
          toolOutput = await createCalendarEvent(functionArgs);
        } else if (functionName === "createRDStationDeal") {
          toolOutput = await createRDStationDeal(functionArgs);
        } else {
          toolOutput = { success: false, error: `Unknown tool: ${functionName}` };
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(toolOutput),
        });
      }

      // Envia o resultado da ferramenta de volta para a IA para uma resposta final
      completion = await client.chat.completions.create({
        model: env.openai.model,
        messages,
        temperature: env.openai.temperature,
        max_tokens: 400,
      });

      const finalReply = completion.choices[0]?.message?.content?.trim() || 'Como posso ajudar?';
      return { intent: 'tool_executed', confidence: 1.0, reply: finalReply, tool_calls: toolCalls };

    } else {
      // Se não houver tool_calls, processa a resposta de texto normal
      const text = responseMessage?.content?.trim() || 'Como posso ajudar?';

      // Heurística simples de intenção
      const low = text.toLowerCase();
      let qualificationStatus: AIResult['qualification_status'] = 'pending';

      if (/(agend|agenda|horár|reuni|marcar)/.test(low)) {
        qualificationStatus = 'qualified';
        return { intent: 'schedule', confidence: 0.8, reply: text, qualification_status: qualificationStatus };
      }
      if (/(preço|custo|valor|quanto)/.test(low)) {
        qualificationStatus = 'qualified';
        return { intent: 'pricing', confidence: 0.7, reply: text, qualification_status: qualificationStatus };
      }
      if (/(atendente|humano|falar|pessoa)/.test(low)) {
        qualificationStatus = 'unqualified'; // Handoff often means AI couldn't qualify
        return { intent: 'handoff', confidence: 0.9, reply: text, handoff: true, qualification_status: qualificationStatus };
      }
      if (/(obrigado|valeu|tchau|sair|parar)/.test(low)) {
        qualificationStatus = 'unqualified'; // User ending conversation without clear qualification
        return { intent: 'farewell', confidence: 0.7, reply: text, qualification_status: qualificationStatus };
      }

      return { intent: 'qa', confidence: 0.6, reply: text, qualification_status: qualificationStatus };
    }
  } catch (error: any) {
    console.error('OpenAI error or tool execution error:', error);
    return {
      reply: 'Desculpe, tive um problema técnico. Um humano vai assumir o atendimento.',
      intent: 'handoff',
      confidence: 0.1,
      handoff: true,
      qualification_status: 'unqualified',
    };
  }
}