'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@/lib/supabase';
import { AIAgent, AgentType, AgentTone, AgentLanguage, AGENT_TYPES, AGENT_TONES, AGENT_LANGUAGES } from '@/types/ai-agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bot, 
  Settings, 
  Building2, 
  Brain, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  Sparkles,
  Clock,
  Globe,
  MessageSquare,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import PromptAssistant from './prompt-assistant';

interface AdvancedAgentCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
  editingAgent?: AIAgent | null;
}

export default function AdvancedAgentCreator({ onClose, onSuccess, editingAgent }: AdvancedAgentCreatorProps) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [currentTab, setCurrentTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [showPromptAssistant, setShowPromptAssistant] = useState(false);

  const [formData, setFormData] = useState({
    // Aba Básica
    name: editingAgent?.name || '',
    type: (editingAgent?.type || 'sdr') as AgentType,
    description: editingAgent?.description || '',
    
    // Aba Configurações Avançadas
    agent_name: editingAgent?.agent_name || '',
    initial_message: editingAgent?.initial_message || '',
    tone: (editingAgent?.tone || 'amigavel') as AgentTone,
    language: (editingAgent?.language || 'pt-BR') as AgentLanguage,
    timezone: editingAgent?.timezone || 'America/Sao_Paulo',
    response_delay_ms: editingAgent?.response_delay_ms || 2000,
    
    // Aba Empresa
    company_name: editingAgent?.company_name || '',
    company_sector: editingAgent?.company_sector || '',
    company_website: editingAgent?.company_website || '',
    company_description: editingAgent?.company_description || '',
    
    // Aba Comportamento
    default_behavior: editingAgent?.default_behavior || `O seu nome é ${editingAgent?.agent_name || 'Cora'}, responsável em fazer o atendimento ao cliente.
Responda de forma direta e eficiente, sem verbosidade.
SEMPRE responda com no máximo 100 caracteres por padrão. Só exceda esse limite quando estritamente necessário.
NUNCA faça mais de uma pergunta por vez. SEMPRE faça APENAS uma pergunta de cada vez.
Comporte-se exatamente como um atendente da empresa.
Se necessário, utilize emojis 😄😊🙌🚀🥳🌱🤩 etc. (mas não precisa incluir em todas as mensagens).
Quando for informar uma URL, informe EXATAMENTE a URL disponível.
NUNCA fale dos concorrentes.
NUNCA saia do personagem.`,
    system_prompt: editingAgent?.system_prompt || '',
    
    // Configurações técnicas
    max_tokens: editingAgent?.max_tokens || 1000,
    temperature: editingAgent?.temperature || 0.7,
    is_active: editingAgent?.is_active ?? true
  });

  const tabs = [
    { id: 'basic', label: 'Básico', icon: Bot, description: 'Informações básicas do agente' },
    { id: 'advanced', label: 'Configurações', icon: Settings, description: 'Tom, idioma e comportamento' },
    { id: 'company', label: 'Empresa', icon: Building2, description: 'Informações da empresa' },
    { id: 'behavior', label: 'Comportamento', icon: Brain, description: 'Prompt e regras de comportamento' },
    { id: 'review', label: 'Revisão', icon: CheckCircle, description: 'Revisar e criar agente' }
  ];

  const handleNext = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Buscar organization_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ Erro ao buscar organization_id:', userError);
        throw new Error('Não foi possível identificar a organização do usuário');
      }

      const organizationId = userData?.organization_id || user.id;
      
      const agentData = {
        ...formData,
        organization_id: organizationId
      };

      if (editingAgent) {
        // Atualizar agente existente
        const { error } = await supabase
          .from('ai_agents')
          .update({
            ...agentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAgent.id);

        if (error) throw error;
        
        toast.success('Agente atualizado com sucesso!', {
          description: `O agente "${formData.name}" foi atualizado com as novas configurações.`
        });
      } else {
        // Criar novo agente
        const { error } = await supabase
          .from('ai_agents')
          .insert(agentData);

        if (error) throw error;
        
        toast.success('Agente criado com sucesso!', {
          description: `O agente "${formData.name}" está pronto para responder automaticamente.`
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast.error('Erro ao salvar agente', {
        description: 'Não foi possível salvar o agente. Verifique os dados e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromptGenerated = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      system_prompt: prompt
    }));
    setShowPromptAssistant(false);
  };

  const isTabValid = (tabId: string) => {
    switch (tabId) {
      case 'basic':
        return formData.name && formData.type;
      case 'advanced':
        return formData.agent_name && formData.tone && formData.language;
      case 'company':
        return formData.company_name && formData.company_sector && formData.company_description;
      case 'behavior':
        return formData.default_behavior && formData.system_prompt;
      default:
        return true;
    }
  };

  const getCurrentTabIndex = () => tabs.findIndex(tab => tab.id === currentTab);
  const canGoNext = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex < tabs.length - 1 && isTabValid(currentTab);
  };
  const canGoPrevious = () => getCurrentTabIndex() > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-500" />
            {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
          </DialogTitle>
          <DialogDescription>
            Configure um agente de IA profissional com configurações avançadas
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isValid = isTabValid(tab.id);
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <Icon className={`h-4 w-4 ${isValid ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Aba Básica */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Configure as informações fundamentais do seu agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Agente</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Agente SDR"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Tipo de Agente</Label>
                    <Select value={formData.type} onValueChange={(value: AgentType) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AGENT_TYPES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{config.icon}</span>
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição do agente e suas responsabilidades"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Configurações Avançadas */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Avançadas
                </CardTitle>
                <CardDescription>
                  Personalize o comportamento e identidade do agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent_name">Nome que o Agente Usa</Label>
                    <Input
                      id="agent_name"
                      value={formData.agent_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                      placeholder="Ex: Cora"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Nome que o agente se apresenta aos clientes
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="tone">Tom de Voz</Label>
                    <Select value={formData.tone} onValueChange={(value: AgentTone) => setFormData(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AGENT_TONES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{config.emoji}</span>
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-sm text-gray-500">{config.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={formData.language} onValueChange={(value: AgentLanguage) => setFormData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AGENT_LANGUAGES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{config.flag}</span>
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">🇧🇷 São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">🇺🇸 Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">🇬🇧 Londres (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Paris">🇫🇷 Paris (GMT+1)</SelectItem>
                        <SelectItem value="Asia/Tokyo">🇯🇵 Tóquio (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="initial_message">Mensagem Inicial (Opcional)</Label>
                  <Textarea
                    id="initial_message"
                    value={formData.initial_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, initial_message: e.target.value }))}
                    placeholder="Ex: Olá! Sou a Cora, sua assistente virtual. Como posso ajudá-lo hoje?"
                    rows={2}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Mensagem que o agente envia quando uma conversa é iniciada
                  </p>
                </div>

                <div>
                  <Label htmlFor="response_delay">Delay de Resposta (ms)</Label>
                  <Input
                    id="response_delay"
                    type="number"
                    value={formData.response_delay_ms}
                    onChange={(e) => setFormData(prev => ({ ...prev, response_delay_ms: parseInt(e.target.value) }))}
                    min="0"
                    max="10000"
                    step="500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tempo de espera antes de enviar a resposta (simula tempo humano)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Empresa */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
                <CardDescription>
                  Configure as informações da empresa que o agente representa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Nome da Empresa</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Ex: Minha Empresa Ltda"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company_sector">Setor da Empresa</Label>
                    <Input
                      id="company_sector"
                      value={formData.company_sector}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_sector: e.target.value }))}
                      placeholder="Ex: Tecnologia, Saúde, Educação"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_website">Website da Empresa</Label>
                  <Input
                    id="company_website"
                    value={formData.company_website}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                    placeholder="Ex: https://minhaempresa.com.br"
                    type="url"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    O agente pode usar este site para buscar informações atualizadas
                  </p>
                </div>

                <div>
                  <Label htmlFor="company_description">Descrição da Empresa</Label>
                  <Textarea
                    id="company_description"
                    value={formData.company_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                    placeholder="Descreva a empresa, seus produtos/serviços, missão, valores..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Comportamento */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Comportamento e Prompt
                </CardTitle>
                <CardDescription>
                  Configure como o agente deve se comportar e responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default_behavior">Comportamento Padrão</Label>
                  <Textarea
                    id="default_behavior"
                    value={formData.default_behavior}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_behavior: e.target.value }))}
                    placeholder="Regras básicas de comportamento..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="system_prompt">Prompt do Sistema</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPromptAssistant(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Criar com IA
                    </Button>
                  </div>
                  <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    placeholder="Instruções detalhadas para o comportamento do agente"
                    rows={8}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                      min="100"
                      max="4000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="temperature">Temperatura</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      min="0"
                      max="2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Revisão */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Revisão Final
                </CardTitle>
                <CardDescription>
                  Revise todas as configurações antes de criar o agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Básicas */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Informações Básicas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {formData.name}</div>
                      <div><strong>Tipo:</strong> {AGENT_TYPES[formData.type]?.label}</div>
                      <div><strong>Descrição:</strong> {formData.description || 'Não informado'}</div>
                    </div>
                  </div>

                  {/* Configurações Avançadas */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome do Agente:</strong> {formData.agent_name}</div>
                      <div><strong>Tom:</strong> {AGENT_TONES[formData.tone]?.label}</div>
                      <div><strong>Idioma:</strong> {AGENT_LANGUAGES[formData.language]?.label}</div>
                      <div><strong>Timezone:</strong> {formData.timezone}</div>
                      <div><strong>Delay:</strong> {formData.response_delay_ms}ms</div>
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Empresa
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {formData.company_name}</div>
                      <div><strong>Setor:</strong> {formData.company_sector}</div>
                      <div><strong>Website:</strong> {formData.company_website || 'Não informado'}</div>
                    </div>
                  </div>

                  {/* Comportamento */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Comportamento
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Tokens:</strong> {formData.max_tokens}</div>
                      <div><strong>Temperatura:</strong> {formData.temperature}</div>
                      <div><strong>Status:</strong> 
                        <Badge variant={formData.is_active ? "default" : "secondary"} className="ml-2">
                          {formData.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Ativar agente imediatamente</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navegação */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            
            {currentTab === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingAgent ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editingAgent ? 'Atualizar Agente' : 'Criar Agente'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="bg-green-500 hover:bg-green-600"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Modal do Assistente de Prompts */}
        <Dialog open={showPromptAssistant} onOpenChange={setShowPromptAssistant}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <PromptAssistant
              onPromptGenerated={handlePromptGenerated}
              onClose={() => setShowPromptAssistant(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
