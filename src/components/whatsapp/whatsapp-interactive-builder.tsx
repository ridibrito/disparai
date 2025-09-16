'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Loader2,
  Settings,
  Bot,
  List,
  FileText,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { whatsappInteractiveMessagesService, type ButtonMessage, type ListMessage, type TemplateMessage, type PollMessage } from '@/lib/whatsapp-interactive-messages';
import toast from 'react-hot-toast';

interface WhatsAppInteractiveBuilderProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppInteractiveBuilder({ instanceKey, instanceName }: WhatsAppInteractiveBuilderProps) {
  const [activeTab, setActiveTab] = useState('button');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Estados para diferentes tipos de mensagem
  const [buttonMessage, setButtonMessage] = useState<ButtonMessage>({
    to: '',
    body: '',
    buttons: [{ id: '1', title: '' }]
  });
  
  const [listMessage, setListMessage] = useState<ListMessage>({
    to: '',
    body: '',
    buttonText: 'Ver opções',
    sections: [{
      title: 'Seção 1',
      rows: [{ id: '1', title: '', description: '' }]
    }]
  });
  
  const [templateMessage, setTemplateMessage] = useState<TemplateMessage>({
    to: '',
    templateName: '',
    language: 'pt_BR',
    components: []
  });
  
  const [pollMessage, setPollMessage] = useState<PollMessage>({
    to: '',
    name: '',
    options: ['', ''],
    selectableCount: 1
  });

  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  // Carregar templates salvos
  useEffect(() => {
    loadTemplates();
  }, [instanceKey]);

  const loadTemplates = async () => {
    try {
      const result = await whatsappInteractiveMessagesService.loadInteractiveTemplates(instanceKey);
      if (result.success && result.data) {
        setSavedTemplates(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const addButton = () => {
    if (buttonMessage.buttons.length < 3) {
      setButtonMessage(prev => ({
        ...prev,
        buttons: [...prev.buttons, { id: (prev.buttons.length + 1).toString(), title: '' }]
      }));
    }
  };

  const removeButton = (index: number) => {
    if (buttonMessage.buttons.length > 1) {
      setButtonMessage(prev => ({
        ...prev,
        buttons: prev.buttons.filter((_, i) => i !== index)
      }));
    }
  };

  const updateButton = (index: number, title: string) => {
    setButtonMessage(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => i === index ? { ...btn, title } : btn)
    }));
  };

  const addListRow = (sectionIndex: number) => {
    setListMessage(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, rows: [...section.rows, { id: (section.rows.length + 1).toString(), title: '', description: '' }] }
          : section
      )
    }));
  };

  const removeListRow = (sectionIndex: number, rowIndex: number) => {
    setListMessage(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, rows: section.rows.filter((_, j) => j !== rowIndex) }
          : section
      )
    }));
  };

  const addPollOption = () => {
    if (pollMessage.options.length < 12) {
      setPollMessage(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removePollOption = (index: number) => {
    if (pollMessage.options.length > 2) {
      setPollMessage(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const sendMessage = async () => {
    try {
      setLoading(true);
      let result;

      switch (activeTab) {
        case 'button':
          result = await whatsappInteractiveMessagesService.sendButtonMessage(instanceKey, buttonMessage);
          break;
        case 'list':
          result = await whatsappInteractiveMessagesService.sendListMessage(instanceKey, listMessage);
          break;
        case 'template':
          result = await whatsappInteractiveMessagesService.sendTemplateMessage(instanceKey, templateMessage);
          break;
        case 'poll':
          result = await whatsappInteractiveMessagesService.sendPollMessage(instanceKey, pollMessage);
          break;
        default:
          throw new Error('Tipo de mensagem não suportado');
      }

      if (result.success) {
        toast.success('Mensagem enviada com sucesso!');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      setSaving(true);
      
      let templateData;
      let templateName;
      
      switch (activeTab) {
        case 'button':
          templateData = buttonMessage;
          templateName = `Botões - ${new Date().toLocaleString()}`;
          break;
        case 'list':
          templateData = listMessage;
          templateName = `Lista - ${new Date().toLocaleString()}`;
          break;
        case 'template':
          templateData = templateMessage;
          templateName = `Template - ${new Date().toLocaleString()}`;
          break;
        case 'poll':
          templateData = pollMessage;
          templateName = `Enquete - ${new Date().toLocaleString()}`;
          break;
        default:
          throw new Error('Tipo de mensagem não suportado');
      }

      const result = await whatsappInteractiveMessagesService.saveInteractiveTemplate(instanceKey, {
        name: templateName,
        type: activeTab,
        data: templateData
      });

      if (result.success) {
        toast.success('Template salvo com sucesso!');
        await loadTemplates();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const loadTemplate = (template: any) => {
    switch (template.template_type) {
      case 'button':
        setButtonMessage(template.template_data);
        setActiveTab('button');
        break;
      case 'list':
        setListMessage(template.template_data);
        setActiveTab('list');
        break;
      case 'template':
        setTemplateMessage(template.template_data);
        setActiveTab('template');
        break;
      case 'poll':
        setPollMessage(template.template_data);
        setActiveTab('poll');
        break;
    }
    toast.success('Template carregado!');
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    try {
      const result = await whatsappInteractiveMessagesService.deleteInteractiveTemplate(templateId);
      if (result.success) {
        toast.success('Template deletado com sucesso!');
        await loadTemplates();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao deletar template:', error);
      toast.error(error.message || 'Erro ao deletar template');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Construtor de Mensagens Interativas
          </CardTitle>
          <CardDescription>
            Crie mensagens ricas com botões, listas, templates e enquetes
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="button" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Botões
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="poll" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Enquete
              </TabsTrigger>
            </TabsList>

            <TabsContent value="button" className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de destino</label>
                  <Input
                    value={buttonMessage.to}
                    onChange={(e) => setButtonMessage(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="5511999999999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem</label>
                  <Textarea
                    value={buttonMessage.body}
                    onChange={(e) => setButtonMessage(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Digite sua mensagem..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Botões</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addButton}
                      disabled={buttonMessage.buttons.length >= 3}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {buttonMessage.buttons.map((button, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={button.title}
                        onChange={(e) => updateButton(index, e.target.value)}
                        placeholder={`Botão ${index + 1}`}
                        maxLength={20}
                      />
                      {buttonMessage.buttons.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeButton(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de destino</label>
                  <Input
                    value={listMessage.to}
                    onChange={(e) => setListMessage(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="5511999999999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem</label>
                  <Textarea
                    value={listMessage.body}
                    onChange={(e) => setListMessage(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Digite sua mensagem..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Texto do botão</label>
                  <Input
                    value={listMessage.buttonText}
                    onChange={(e) => setListMessage(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Ver opções"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Seções</label>
                  {listMessage.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="border rounded-lg p-4 mb-4">
                      <Input
                        value={section.title}
                        onChange={(e) => setListMessage(prev => ({
                          ...prev,
                          sections: prev.sections.map((s, i) => 
                            i === sectionIndex ? { ...s, title: e.target.value } : s
                          )
                        }))}
                        placeholder="Título da seção"
                        className="mb-3"
                      />
                      
                      {section.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-2 mb-2">
                          <Input
                            value={row.title}
                            onChange={(e) => setListMessage(prev => ({
                              ...prev,
                              sections: prev.sections.map((s, i) => 
                                i === sectionIndex 
                                  ? { ...s, rows: s.rows.map((r, j) => 
                                      j === rowIndex ? { ...r, title: e.target.value } : r
                                    )}
                                  : s
                              )
                            }))}
                            placeholder="Título do item"
                          />
                          <Input
                            value={row.description || ''}
                            onChange={(e) => setListMessage(prev => ({
                              ...prev,
                              sections: prev.sections.map((s, i) => 
                                i === sectionIndex 
                                  ? { ...s, rows: s.rows.map((r, j) => 
                                      j === rowIndex ? { ...r, description: e.target.value } : r
                                    )}
                                  : s
                              )
                            }))}
                            placeholder="Descrição (opcional)"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeListRow(sectionIndex, rowIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addListRow(sectionIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar item
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="template" className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de destino</label>
                  <Input
                    value={templateMessage.to}
                    onChange={(e) => setTemplateMessage(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="5511999999999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do template</label>
                  <Input
                    value={templateMessage.templateName}
                    onChange={(e) => setTemplateMessage(prev => ({ ...prev, templateName: e.target.value }))}
                    placeholder="nome_do_template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Idioma</label>
                  <Input
                    value={templateMessage.language}
                    onChange={(e) => setTemplateMessage(prev => ({ ...prev, language: e.target.value }))}
                    placeholder="pt_BR"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="poll" className="mt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de destino</label>
                  <Input
                    value={pollMessage.to}
                    onChange={(e) => setPollMessage(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="5511999999999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da enquete</label>
                  <Input
                    value={pollMessage.name}
                    onChange={(e) => setPollMessage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Pergunta da enquete"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Opções</label>
                  {pollMessage.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={option}
                        onChange={(e) => setPollMessage(prev => ({
                          ...prev,
                          options: prev.options.map((opt, i) => i === index ? e.target.value : opt)
                        }))}
                        placeholder={`Opção ${index + 1}`}
                      />
                      {pollMessage.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePollOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPollOption}
                    disabled={pollMessage.options.length >= 12}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar opção
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Opções selecionáveis</label>
                  <Input
                    type="number"
                    value={pollMessage.selectableCount}
                    onChange={(e) => setPollMessage(prev => ({ ...prev, selectableCount: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max={pollMessage.options.length}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Ações */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              onClick={sendMessage}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Mensagem
            </Button>
            
            <Button
              variant="outline"
              onClick={saveTemplate}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Salvos */}
      {savedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Templates Salvos
            </CardTitle>
            <CardDescription>
              Seus templates de mensagens interativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTemplates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.template_name}</h4>
                    <Badge variant="secondary">
                      {template.template_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {new Date(template.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
