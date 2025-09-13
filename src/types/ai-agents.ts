export interface AIAgent {
  id: string;
  organization_id: string;
  name: string;
  type: AgentType;
  description?: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentInstanceConfig {
  id: string;
  organization_id: string;
  whatsapp_instance_id: string;
  agent_id: string;
  is_enabled: boolean;
  escalation_rules?: EscalationRules;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  agent?: AIAgent;
  whatsapp_instance?: {
    id: string;
    name: string;
    instance_key: string;
  };
}

export interface AgentResponse {
  id: string;
  organization_id: string;
  conversation_id: string;
  agent_id: string;
  message_id: string;
  user_message: string;
  agent_response: string;
  response_time_ms?: number;
  tokens_used?: number;
  created_at: string;
  // Relacionamentos
  agent?: AIAgent;
  conversation?: {
    id: string;
    contacts?: {
      name: string;
      phone: string;
    };
  };
}

export type AgentType = 
  | 'sdr' 
  | 'atendimento' 
  | 'vendas' 
  | 'suporte' 
  | 'qualificacao' 
  | 'followup' 
  | 'custom';

export interface EscalationRules {
  // Condições para escalar para humano
  keywords?: string[]; // Palavras que indicam necessidade de humano
  sentiment_threshold?: number; // Limite de sentimento negativo
  max_responses?: number; // Máximo de respostas automáticas
  time_limit?: number; // Tempo limite em minutos
  custom_conditions?: string; // Condições customizadas
}

export interface AgentConfigForm {
  name: string;
  type: AgentType;
  description?: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
}

export interface AgentInstanceConfigForm {
  whatsapp_instance_id: string;
  agent_id: string;
  is_enabled: boolean;
  escalation_rules?: EscalationRules;
}

export interface AIResponse {
  response: string;
  should_escalate: boolean;
  escalation_reason?: string;
  tokens_used: number;
  response_time_ms: number;
}

export interface ConversationContext {
  conversation_id: string;
  contact_name: string;
  contact_phone: string;
  message_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  last_message: string;
  agent_type: AgentType;
  organization_info?: {
    name: string;
    industry?: string;
    products?: string[];
  };
}

export const AGENT_TYPES: Record<AgentType, { label: string; description: string; icon: string }> = {
  sdr: {
    label: 'SDR',
    description: 'Qualificação de leads e primeiros contatos',
    icon: '🎯'
  },
  atendimento: {
    label: 'Atendimento',
    description: 'Suporte e atendimento ao cliente',
    icon: '🎧'
  },
  vendas: {
    label: 'Vendas',
    description: 'Vendas e fechamento de negócios',
    icon: '💰'
  },
  suporte: {
    label: 'Suporte',
    description: 'Suporte técnico e resolução de problemas',
    icon: '🔧'
  },
  qualificacao: {
    label: 'Qualificação',
    description: 'Qualificação avançada de leads',
    icon: '📋'
  },
  followup: {
    label: 'Follow-up',
    description: 'Acompanhamento e nurturing de leads',
    icon: '📞'
  },
  custom: {
    label: 'Personalizado',
    description: 'Agente configurado pelo usuário',
    icon: '⚙️'
  }
};

export const DEFAULT_AGENT_PROMPTS: Record<AgentType, string> = {
  sdr: `Você é um Agente SDR (Sales Development Representative) especializado em qualificar leads e fazer primeiros contatos. Seu objetivo é:

1. Identificar se o lead tem interesse real no produto/serviço
2. Coletar informações básicas sobre necessidades e orçamento
3. Agendar reuniões com o time de vendas quando apropriado
4. Manter um tom profissional mas amigável
5. Fazer perguntas abertas para entender melhor o lead

Sempre seja educado, objetivo e focado em ajudar o lead a entender como podemos resolver seus problemas.`,

  atendimento: `Você é um Agente de Atendimento ao Cliente especializado em resolver dúvidas e fornecer suporte. Seu objetivo é:

1. Responder perguntas sobre produtos/serviços de forma clara
2. Resolver problemas e dúvidas dos clientes
3. Manter um tom cordial e prestativo
4. Escalar para um humano quando necessário
5. Coletar feedback e sugestões

Sempre seja paciente, prestativo e focado em resolver o problema do cliente da melhor forma possível.`,

  vendas: `Você é um Agente de Vendas especializado em identificar oportunidades e fechar negócios. Seu objetivo é:

1. Identificar necessidades específicas do cliente
2. Apresentar soluções adequadas
3. Superar objeções de forma educada
4. Criar urgência quando apropriado
5. Fechar negócios ou agendar reuniões de fechamento

Sempre seja consultivo, focado em valor e respeitoso com o tempo do cliente.`,

  suporte: `Você é um Agente de Suporte Técnico especializado em resolver problemas técnicos. Seu objetivo é:

1. Diagnosticar problemas técnicos de forma sistemática
2. Fornecer soluções passo a passo
3. Escalar para suporte avançado quando necessário
4. Manter um tom técnico mas acessível
5. Documentar problemas e soluções

Sempre seja metódico, claro e focado em resolver o problema técnico.`,

  qualificacao: `Você é um Agente de Qualificação especializado em avaliar leads de forma detalhada. Seu objetivo é:

1. Avaliar o fit do lead com o produto/serviço
2. Identificar o poder de decisão e orçamento
3. Entender o timing e urgência da necessidade
4. Coletar informações estratégicas
5. Classificar o lead adequadamente

Sempre seja estratégico, detalhado e focado em entender o contexto completo do lead.`,

  followup: `Você é um Agente de Follow-up especializado em acompanhar leads e clientes. Seu objetivo é:

1. Manter relacionamento com leads em diferentes estágios
2. Nurturar leads que não estão prontos para comprar
3. Reativar leads que ficaram inativos
4. Acompanhar clientes existentes
5. Identificar novas oportunidades

Sempre seja persistente mas respeitoso, focado em construir relacionamento de longo prazo.`,

  custom: `Você é um Agente personalizado configurado pelo usuário. Siga as instruções específicas fornecidas na configuração.`
};
