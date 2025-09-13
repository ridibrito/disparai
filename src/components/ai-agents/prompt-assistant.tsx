'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, CheckCircle, ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PromptAssistantProps {
  onPromptGenerated: (prompt: string) => void;
  onClose: () => void;
}

interface Question {
  id: string;
  question: string;
  placeholder: string;
  required: boolean;
}

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'company_description',
    question: 'Descreva sua empresa e o objetivo do agente',
    placeholder: 'Ex: Minha empresa é uma corretora de planos de saúde que atende clientes em Brasília, seu papel é qualificar e agendar uma reunião',
    required: true
  },
  {
    id: 'target_audience',
    question: 'Qual é o seu público-alvo?',
    placeholder: 'Ex: Empresas com 10-50 funcionários, pessoas físicas interessadas em planos de saúde',
    required: false
  },
  {
    id: 'common_objections',
    question: 'Que objeções você costuma receber?',
    placeholder: 'Ex: "Muito caro", "Já tenho plano", "Preciso pensar"',
    required: false
  },
  {
    id: 'information_needed',
    question: 'Que informações você precisa coletar?',
    placeholder: 'Ex: Número de funcionários, faixa etária, orçamento disponível',
    required: false
  },
  {
    id: 'sales_process',
    question: 'Qual é o seu processo de vendas?',
    placeholder: 'Ex: Qualificação → Apresentação → Proposta → Fechamento',
    required: false
  }
];

export default function PromptAssistant({ onPromptGenerated, onClose }: PromptAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const currentQuestion = INITIAL_QUESTIONS[currentStep];
  const isLastStep = currentStep === INITIAL_QUESTIONS.length - 1;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
      toast.error('Esta pergunta é obrigatória');
      return;
    }
    
    if (isLastStep) {
      generatePrompt();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generatePrompt = async () => {
    setIsGenerating(true);
    
    try {
      // Simular geração de prompt (aqui você integraria com OpenAI)
      const prompt = await generatePromptWithAI(answers);
      setGeneratedPrompt(prompt);
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      toast.error('Erro ao gerar prompt. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePromptWithAI = async (answers: Record<string, string>): Promise<string> => {
    // Simulação de geração de prompt
    // Em produção, você chamaria a API do OpenAI aqui
    
    const companyDesc = answers.company_description || '';
    const targetAudience = answers.target_audience || '';
    const objections = answers.common_objections || '';
    const infoNeeded = answers.information_needed || '';
    const salesProcess = answers.sales_process || '';

    return `Você é um Agente de IA especializado em ${companyDesc.toLowerCase()}.

OBJETIVO PRINCIPAL:
${companyDesc}

PÚBLICO-ALVO:
${targetAudience || 'Clientes interessados nos produtos/serviços da empresa'}

INFORMAÇÕES A COLETAR:
${infoNeeded || 'Informações básicas sobre necessidades e interesse'}

PROCESSO DE VENDAS:
${salesProcess || 'Qualificação → Apresentação → Proposta → Fechamento'}

OBJEÇÕES COMUNS E COMO LIDAR:
${objections || 'Seja educado e focado em resolver as necessidades do cliente'}

INSTRUÇÕES ESPECÍFICAS:
1. Seja sempre educado, profissional e prestativo
2. Faça perguntas abertas para entender melhor as necessidades
3. Foque em valor e benefícios, não apenas em preços
4. Se não souber responder algo, seja honesto e ofereça ajuda
5. Sempre agradeça o interesse e mantenha um tom positivo
6. Se o cliente não estiver interessado, seja respeitoso e deixe a porta aberta

ESCALAÇÃO:
- Escale para um humano se o cliente solicitar
- Escale se houver questões técnicas complexas
- Escale se o cliente quiser falar com um supervisor

Lembre-se: Seu objetivo é ajudar o cliente e criar uma experiência positiva, mesmo que não resulte em venda imediata.`;
  };

  const handleUsePrompt = () => {
    onPromptGenerated(generatedPrompt);
    onClose();
    toast.success('Prompt aplicado com sucesso!');
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success('Prompt copiado para a área de transferência!');
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setGeneratedPrompt('');
  };

  if (generatedPrompt) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            <CardTitle>Prompt Gerado com IA</CardTitle>
          </div>
          <CardDescription>
            Seu prompt personalizado está pronto! Revise e use no agente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Prompt Gerado:</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestart}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refazer
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedPrompt}
              readOnly
              rows={20}
              className="bg-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleUsePrompt} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Usar Este Prompt
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-green-500" />
          <CardTitle>Assistente de Criação de Prompts</CardTitle>
        </div>
        <CardDescription>
          Vou te ajudar a criar um prompt personalizado para seu agente de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {INITIAL_QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-medium">
              {currentQuestion.question}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              {currentQuestion.placeholder}
            </p>
          </div>
          
          <Textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            rows={4}
            className="w-full"
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isGenerating}
            className="bg-green-500 hover:bg-green-600"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Prompt
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
