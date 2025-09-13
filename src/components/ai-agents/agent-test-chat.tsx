'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Play,
  RotateCcw,
  Settings,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AgentTestChatProps {
  agentConfig: {
    name: string;
    agent_name: string;
    tone: string;
    language: string;
    initial_message?: string;
    default_behavior: string;
    system_prompt: string;
    company_name: string;
    company_sector: string;
    company_description: string;
    response_delay_ms: number;
    max_tokens: number;
    temperature: number;
  };
  isVisible: boolean;
  onToggle: () => void;
}

export default function AgentTestChat({ agentConfig, isVisible, onToggle }: AgentTestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isVisible && !isInitialized) {
      // Adicionar mensagem inicial quando o chat é aberto
      if (agentConfig.initial_message) {
        setMessages([{
          id: '1',
          type: 'agent',
          content: agentConfig.initial_message,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          id: '1',
          type: 'agent',
          content: `Olá! Sou a ${agentConfig.agent_name}, sua assistente virtual da ${agentConfig.company_name}. Como posso ajudá-lo hoje?`,
          timestamp: new Date()
        }]);
      }
      setIsInitialized(true);
    }
  }, [isVisible, isInitialized, agentConfig]);

  const simulateAgentResponse = async (userMessage: string): Promise<string> => {
    // Simular delay de resposta
    await new Promise(resolve => setTimeout(resolve, agentConfig.response_delay_ms));
    
    // Simular diferentes tipos de resposta baseado no tom e configurações
    const responses = generateResponses(userMessage);
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateResponses = (userMessage: string): string[] => {
    const { tone, agent_name, company_name, company_sector } = agentConfig;
    const message = userMessage.toLowerCase();

    // Respostas baseadas no tom
    const toneResponses = {
      formal: [
        `Prezado(a), agradeço seu contato. Como posso auxiliá-lo(a) hoje?`,
        `Boa tarde! Sou a ${agent_name} da ${company_name}. Em que posso ser útil?`,
        `Olá! É um prazer atendê-lo(a). Como posso ajudá-lo(a)?`
      ],
      casual: [
        `Oi! Tudo bem? Como posso te ajudar hoje? 😊`,
        `E aí! Sou a ${agent_name}, sua assistente da ${company_name}. O que você precisa?`,
        `Olá! Que bom te ver por aqui! Como posso ajudar?`
      ],
      amigavel: [
        `Oi! Que alegria te conhecer! Sou a ${agent_name} 🤗`,
        `Olá, querido(a)! Como posso tornar seu dia melhor hoje?`,
        `Oi! Seja muito bem-vindo(a)! Sou a ${agent_name} da ${company_name} 💕`
      ],
      profissional: [
        `Olá! Sou a ${agent_name}, especialista em atendimento da ${company_name}.`,
        `Bom dia! Como posso resolver sua questão hoje?`,
        `Olá! Estou aqui para oferecer o melhor atendimento. Como posso ajudar?`
      ],
      empolgado: [
        `Oi! Que energia boa! Sou a ${agent_name} e estou super animada para te ajudar! 🚀`,
        `Olá! Que dia incrível para conversarmos! Como posso te ajudar hoje? ✨`,
        `Oi! Estou super empolgada para te atender! Sou a ${agent_name} 🎉`
      ],
      calmo: [
        `Olá... que paz te receber aqui. Como posso ajudar? 🧘`,
        `Oi, que tranquilidade... Sou a ${agent_name}. Em que posso ser útil?`,
        `Olá... que momento sereno para conversarmos. Como posso ajudar?`
      ]
    };

    // Respostas específicas baseadas no conteúdo da mensagem
    if (message.includes('preço') || message.includes('valor') || message.includes('custo')) {
      return [
        `Sobre preços, preciso de mais informações para te dar uma resposta precisa. Qual produto ou serviço te interessa?`,
        `Posso te ajudar com informações sobre preços! Me conte qual produto você está procurando.`,
        `Para te dar o melhor preço, preciso saber mais detalhes. O que você está buscando?`
      ];
    }

    if (message.includes('horário') || message.includes('funcionamento') || message.includes('aberto')) {
      return [
        `Nossos horários de funcionamento são de segunda a sexta, das 9h às 18h.`,
        `Estamos abertos de segunda a sexta, das 9h às 18h. Posso ajudar com mais alguma coisa?`,
        `Funcionamos de segunda a sexta, das 9h às 18h. Como mais posso ajudar?`
      ];
    }

    if (message.includes('contato') || message.includes('telefone') || message.includes('email')) {
      return [
        `Você pode nos contatar pelo WhatsApp, email ou telefone. Qual forma prefere?`,
        `Temos várias formas de contato! WhatsApp, email, telefone... Qual você prefere?`,
        `Posso te passar nossos contatos! Qual forma de comunicação você prefere?`
      ];
    }

    if (message.includes('obrigado') || message.includes('obrigada') || message.includes('valeu')) {
      return [
        `De nada! Foi um prazer ajudar! 😊`,
        `Por nada! Estou sempre aqui quando precisar!`,
        `Imagina! Foi um prazer te atender! Volte sempre!`
      ];
    }

    // Respostas padrão baseadas no tom
    return toneResponses[tone as keyof typeof toneResponses] || toneResponses.amigavel;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Adicionar mensagem de "digitando"
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      type: 'agent',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await simulateAgentResponse(inputMessage);
      
      // Remover mensagem de "digitando" e adicionar resposta
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: Date.now().toString(),
          type: 'agent',
          content: response,
          timestamp: new Date()
        }];
      });
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      toast.error('Erro ao gerar resposta do agente');
      
      // Remover mensagem de "digitando"
      setMessages(prev => prev.filter(msg => !msg.isTyping));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setIsInitialized(false);
    if (isVisible) {
      // Re-inicializar com mensagem inicial
      setTimeout(() => {
        if (agentConfig.initial_message) {
          setMessages([{
            id: '1',
            type: 'agent',
            content: agentConfig.initial_message,
            timestamp: new Date()
          }]);
        } else {
          setMessages([{
            id: '1',
            type: 'agent',
            content: `Olá! Sou a ${agentConfig.agent_name}, sua assistente virtual da ${agentConfig.company_name}. Como posso ajudá-lo hoje?`,
            timestamp: new Date()
          }]);
        }
        setIsInitialized(true);
      }, 100);
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 shadow-lg"
        size="lg"
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        Testar Agente
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50">
      <Card className="h-full flex flex-col shadow-2xl border-2 border-green-200">
        <CardHeader className="pb-3 bg-green-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Teste do Agente</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetChat}
                className="h-8 w-8 p-0"
                title="Reiniciar chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
                title="Fechar chat"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="outline" className="text-xs">
              {agentConfig.agent_name}
            </Badge>
            <span>•</span>
            <span>{agentConfig.company_name}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.type === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Digitando...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              <div className="flex items-center justify-center gap-4">
                <span>Tom: {agentConfig.tone}</span>
                <span>•</span>
                <span>Delay: {agentConfig.response_delay_ms}ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
