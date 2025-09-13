import { AIResponse, ConversationContext, AIAgent } from '@/types/ai-agents';

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Gera resposta do agente de IA baseada no contexto da conversa
   */
  async generateAgentResponse(
    agent: AIAgent,
    context: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Construir mensagens para a API
      const messages = this.buildMessages(agent, context);
      
      // Chamar API da OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: agent.max_tokens || this.config.maxTokens,
          temperature: agent.temperature || this.config.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Extrair resposta e metadados
      const aiResponse = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      // Verificar se deve escalar para humano
      const shouldEscalate = this.shouldEscalateToHuman(aiResponse, context);

      return {
        response: aiResponse,
        should_escalate: shouldEscalate,
        escalation_reason: shouldEscalate ? 'Resposta indica necessidade de intervenção humana' : undefined,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
      };

    } catch (error) {
      console.error('Erro ao gerar resposta do agente:', error);
      
      // Resposta de fallback em caso de erro
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Um de nossos especialistas entrará em contato em breve.',
        should_escalate: true,
        escalation_reason: 'Erro na API de IA',
        tokens_used: 0,
        response_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Constrói as mensagens para enviar à API da OpenAI
   */
  private buildMessages(agent: AIAgent, context: ConversationContext): Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Mensagem do sistema com o prompt do agente
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(agent, context)
    });

    // Histórico da conversa (últimas 10 mensagens para não exceder tokens)
    const recentHistory = context.message_history.slice(-10);
    
    for (const message of recentHistory) {
      messages.push({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content
      });
    }

    // Última mensagem do usuário
    messages.push({
      role: 'user',
      content: context.last_message
    });

    return messages;
  }

  /**
   * Constrói o prompt do sistema com contexto da organização
   */
  private buildSystemPrompt(agent: AIAgent, context: ConversationContext): string {
    let systemPrompt = agent.system_prompt;

    // Adicionar contexto da organização se disponível
    if (context.organization_info) {
      systemPrompt += `\n\nContexto da organização:
- Nome: ${context.organization_info.name}`;
      
      if (context.organization_info.industry) {
        systemPrompt += `\n- Setor: ${context.organization_info.industry}`;
      }
      
      if (context.organization_info.products?.length) {
        systemPrompt += `\n- Produtos/Serviços: ${context.organization_info.products.join(', ')}`;
      }
    }

    // Adicionar informações do contato
    systemPrompt += `\n\nInformações do contato:
- Nome: ${context.contact_name}
- Telefone: ${context.contact_phone}`;

    // Adicionar instruções sobre escalação
    systemPrompt += `\n\nInstruções importantes:
- Se o cliente demonstrar insatisfação, pedir para falar com supervisor, ou usar palavras como "cancelar", "reclamação", "problema", responda de forma empática e indique que um especialista entrará em contato
- Se não souber responder algo específico, seja honesto e ofereça conectar com um especialista
- Mantenha sempre um tom profissional e prestativo
- Seja conciso mas completo nas respostas`;

    return systemPrompt;
  }

  /**
   * Verifica se a resposta indica necessidade de escalação para humano
   */
  private shouldEscalateToHuman(response: string, context: ConversationContext): boolean {
    const escalationKeywords = [
      'supervisor', 'gerente', 'especialista', 'humano', 'pessoa',
      'cancelar', 'cancelamento', 'reclamação', 'problema', 'erro',
      'não sei', 'não tenho certeza', 'preciso de ajuda'
    ];

    const responseLower = response.toLowerCase();
    
    // Verificar palavras-chave de escalação
    for (const keyword of escalationKeywords) {
      if (responseLower.includes(keyword)) {
        return true;
      }
    }

    // Verificar se a resposta é muito curta (possível erro)
    if (response.length < 10) {
      return true;
    }

    // Verificar se menciona escalação explicitamente
    if (responseLower.includes('especialista') || responseLower.includes('supervisor')) {
      return true;
    }

    return false;
  }

  /**
   * Valida se a configuração da API está correta
   */
  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao validar configuração da API:', error);
      return false;
    }
  }
}

/**
 * Instância singleton do serviço de IA
 */
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    aiServiceInstance = new AIService({
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    });
  }

  return aiServiceInstance;
}

/**
 * Função utilitária para gerar resposta do agente
 */
export async function generateAgentResponse(
  agent: AIAgent,
  context: ConversationContext
): Promise<AIResponse> {
  const service = getAIService();
  return service.generateAgentResponse(agent, context);
}
