'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Settings, 
  Building2, 
  Brain, 
  FileText, 
  Upload,
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  Sparkles,
  Clock,
  Globe,
  MessageSquare,
  User,
  Shield,
  Lock,
  AlertCircle,
  X,
  Plus,
  File,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AgentTestChat from '@/components/ai-agents/agent-test-chat';

export default function NovoAgentePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Debug: verificar se o usuário está carregado
  console.log('NovoAgentePage - User:', user, 'Loading:', isLoading);
  
  const [currentTab, setCurrentTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, url: string, size: number}>>([]);
  const [showTestChat, setShowTestChat] = useState(false);

  const [formData, setFormData] = useState({
    // Aba Básica
    name: '',
    type: 'sdr' as AgentType,
    description: '',
    
    // Aba Configurações Avançadas
    agent_name: '',
    initial_message: '',
    tone: 'amigavel' as AgentTone,
    language: 'pt-BR' as AgentLanguage,
    timezone: 'America/Sao_Paulo',
    response_delay_ms: 2000,
    
    // Aba Empresa
    company_name: '',
    company_sector: '',
    company_website: '',
    company_description: '',
    
    // Aba Comportamento
    default_behavior: `O seu nome é Cora, responsável em fazer o atendimento ao cliente.
Responda de forma direta e eficiente, sem verbosidade.
SEMPRE responda com no máximo 100 caracteres por padrão. Só exceda esse limite quando estritamente necessário.
NUNCA faça mais de uma pergunta por vez. SEMPRE faça APENAS uma pergunta de cada vez.
Comporte-se exatamente como um atendente da empresa.
Se necessário, utilize emojis 😄😊🙌🚀🥳🌱🤩 etc. (mas não precisa incluir em todas as mensagens).
Quando for informar uma URL, informe EXATAMENTE a URL disponível.
NUNCA fale dos concorrentes.
NUNCA saia do personagem.`,
    system_prompt: '',
    
    // Configurações técnicas
    max_tokens: 1000,
    temperature: 0.7,
    is_active: true
  });

  const tabs = [
    { id: 'setup', label: 'Configuração', icon: Bot, description: 'Informações básicas e configurações' },
    { id: 'company', label: 'Empresa', icon: Building2, description: 'Informações da empresa' },
    { id: 'knowledge', label: 'Conhecimento', icon: Brain, description: 'Upload de documentos e FAQ' },
    { id: 'behavior', label: 'Comportamento', icon: MessageSquare, description: 'Prompt e regras de comportamento' },
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      for (const file of Array.from(files)) {
        // Validar tipo de arquivo
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Tipo de arquivo não suportado: ${file.name}`, {
            description: 'Apenas PDF, TXT, DOC e DOCX são permitidos'
          });
          continue;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo muito grande: ${file.name}`, {
            description: 'O arquivo deve ter no máximo 10MB'
          });
          continue;
        }

        // Upload para Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `agent-documents/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('agent-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          toast.error(`Erro ao fazer upload: ${file.name}`);
          continue;
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('agent-documents')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => [...prev, {
          name: file.name,
          url: publicUrl,
          size: file.size
        }]);

        toast.success(`Arquivo enviado: ${file.name}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
        organization_id: organizationId,
        // Adicionar informações dos arquivos
        knowledge_files: uploadedFiles.map(f => ({ name: f.name, url: f.url, size: f.size }))
      };

      // Criar novo agente
      const { error } = await supabase
        .from('ai_agents')
        .insert(agentData);

      if (error) throw error;
      
      toast.success('Agente criado com sucesso!', {
        description: `O agente "${formData.name}" está pronto para responder automaticamente.`
      });

      router.push('/configuracoes/agentes');
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast.error('Erro ao salvar agente', {
        description: 'Não foi possível salvar o agente. Verifique os dados e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const isTabValid = (tabId: string) => {
    switch (tabId) {
      case 'setup':
        return formData.name && formData.type && formData.agent_name && formData.tone && formData.language;
      case 'company':
        return formData.company_name && formData.company_sector && formData.company_description;
      case 'knowledge':
        return true; // Opcional
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

  const getProgress = () => {
    const completedTabs = tabs.filter(tab => isTabValid(tab.id)).length;
    return (completedTabs / tabs.length) * 100;
  };

  // Debug: verificar estado
  console.log('NovoAgentePage - Render state:', { isLoading, user: !!user, currentTab });

  // Mostrar loading enquanto autenticação está carregando
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Novo Agente</h1>
          <p className="text-gray-600">Carregando...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se usuário está autenticado
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Novo Agente</h1>
          <p className="text-gray-600">Usuário não autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8 mt-4">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/configuracoes/agentes" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Agente</h1>
        </div>
        <p className="text-gray-600">Configure um agente de IA profissional para automatizar respostas</p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isValid = isTabValid(tab.id);
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3"
                >
                  <Icon className={`h-4 w-4 ${isValid ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Aba Configuração */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração do Agente
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas e personalize o comportamento do seu agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações Básicas */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Informações Básicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Agente *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Agente SDR"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Nome interno para identificar o agente
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Tipo de Agente *</Label>
                      <Select value={formData.type} onValueChange={(value: AgentType) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AGENT_TYPES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span>{config.icon}</span>
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

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descrição do agente e suas responsabilidades"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Personalização */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Personalização</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="agent_name">Nome que o Agente Usa *</Label>
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
                      <Label htmlFor="tone">Tom de Voz *</Label>
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
                      <Label htmlFor="language">Idioma *</Label>
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
                      <Label htmlFor="timezone">Timezone *</Label>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Empresa */}
          <TabsContent value="company" className="space-y-4">
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
                    <Label htmlFor="company_name">Nome da Empresa *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Ex: Minha Empresa Ltda"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company_sector">Setor da Empresa *</Label>
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
                  <Label htmlFor="company_description">Descrição da Empresa *</Label>
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

          {/* Aba Conhecimento */}
          <TabsContent value="knowledge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Conhecimento do Agente
                </CardTitle>
                <CardDescription>
                  Faça upload de documentos para treinar o agente com informações específicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload de Arquivos */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload de Documentos
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Faça upload de PDFs, documentos Word ou arquivos de texto para treinar o agente
                    </p>
                    
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingFiles}
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Selecionar Arquivos
                        </>
                      )}
                    </label>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Formatos suportados: PDF, TXT, DOC, DOCX (máximo 10MB cada)
                    </p>
                  </div>
                </div>

                {/* Lista de Arquivos Enviados */}
                {uploadedFiles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Arquivos Enviados</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ */}
                <div>
                  <Label htmlFor="faq">FAQ (Perguntas Frequentes)</Label>
                  <Textarea
                    id="faq"
                    placeholder="P: Qual é o horário de funcionamento?&#10;R: Funcionamos de segunda a sexta, das 9h às 18h.&#10;&#10;P: Como posso entrar em contato?&#10;R: Você pode nos contatar pelo WhatsApp ou email..."
                    rows={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Adicione perguntas e respostas frequentes para o agente consultar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Comportamento */}
          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comportamento e Prompt
                </CardTitle>
                <CardDescription>
                  Configure como o agente deve se comportar e responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default_behavior">Comportamento Padrão *</Label>
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
                    <Label htmlFor="system_prompt">Prompt do Sistema *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
          <TabsContent value="review" className="space-y-4">
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informações Básicas */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

                  {/* Conhecimento */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Conhecimento
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Arquivos:</strong> {uploadedFiles.length} documento(s)</div>
                      <div><strong>Tokens:</strong> {formData.max_tokens}</div>
                      <div><strong>Temperatura:</strong> {formData.temperature}</div>
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
      <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/configuracoes/agentes')}>
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
                    Criando Agente...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Criar Agente
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

      {/* Chat de Teste */}
      <AgentTestChat
        agentConfig={{
          name: formData.name || 'Agente',
          agent_name: formData.agent_name || 'Cora',
          tone: formData.tone,
          language: formData.language,
          initial_message: formData.initial_message,
          default_behavior: formData.default_behavior,
          system_prompt: formData.system_prompt,
          company_name: formData.company_name || 'Sua Empresa',
          company_sector: formData.company_sector || 'Tecnologia',
          company_description: formData.company_description || 'Empresa focada em inovação',
          response_delay_ms: formData.response_delay_ms,
          max_tokens: formData.max_tokens,
          temperature: formData.temperature
        }}
        isVisible={showTestChat}
        onToggle={() => setShowTestChat(!showTestChat)}
      />
    </div>
  );
}
