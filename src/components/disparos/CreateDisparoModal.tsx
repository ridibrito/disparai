'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Clock, 
  Users, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Type, 
  User, 
  Settings,
  List,
  UserCheck,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  group?: string;
}

interface CreateDisparoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Variáveis disponíveis para a mensagem
const AVAILABLE_VARIABLES = [
  { key: 'nome', label: 'Nome', description: 'Nome do contato' },
  { key: 'telefone', label: 'Telefone', description: 'Número do telefone' },
  { key: 'email', label: 'Email', description: 'Email do contato' },
  { key: 'grupo', label: 'Grupo', description: 'Grupo do contato' }
];

export default function CreateDisparoModal({ isOpen, onClose, onSuccess }: CreateDisparoModalProps) {
  // Estados do formulário
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dados do disparo
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messageDelay, setMessageDelay] = useState(1);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Seleção de destinatários
  const [recipientType, setRecipientType] = useState<'contacts' | 'list'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Referência para o textarea da mensagem
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar contatos
  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        toast.error('Erro ao carregar contatos');
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Filtrar contatos baseado na busca
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  // Funções de navegação
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Funções de seleção de contatos
  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredContacts.map(contact => contact.id);
    setSelectedContacts(prev => {
      const newSelection = [...prev];
      filteredIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredContacts.map(contact => contact.id);
    setSelectedContacts(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  // Função para inserir variável na mensagem
  const insertVariable = (variable: string) => {
    const textarea = messageTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = message;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{${variable}}` + after;
      
      setMessage(newText);
      
      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  // Validação por etapa
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return name.trim() !== '' && selectedContacts.length > 0;
      case 2:
        return messageDelay >= 1 && messageDelay <= 60;
      case 3:
        return message.trim() !== '';
      default:
        return false;
    }
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          message,
          message_delay: messageDelay,
          scheduled_at: isScheduled && scheduledAt ? scheduledAt.toISOString() : null,
          target_contacts: selectedContacts,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Disparo criado com sucesso!');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || 'Erro ao criar disparo');
      }
    } catch (error) {
      console.error('Erro ao criar disparo:', error);
      toast.error('Erro ao criar disparo');
    } finally {
      setLoading(false);
    }
  };

  // Fechar modal e resetar estado
  const handleClose = () => {
    setCurrentStep(1);
    setName('');
    setMessage('');
    setMessageDelay(1);
    setScheduledAt(undefined);
    setIsScheduled(false);
    setSelectedContacts([]);
    setSearchTerm('');
    setRecipientType('contacts');
    onClose();
  };

  // Renderizar etapa 1: Nome e destinatários
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Disparo</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Promoção Black Friday"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-base font-medium">Destinatários</Label>
        <div className="mt-3 space-y-4">
          {/* Tipo de seleção */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={recipientType === 'contacts' ? 'default' : 'outline'}
              onClick={() => setRecipientType('contacts')}
              className="flex items-center space-x-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Contatos Individuais</span>
            </Button>
            <Button
              type="button"
              variant={recipientType === 'list' ? 'default' : 'outline'}
              onClick={() => setRecipientType('list')}
              className="flex items-center space-x-2"
            >
              <List className="h-4 w-4" />
              <span>Por Lista</span>
            </Button>
          </div>

          {/* Seleção de contatos */}
          {recipientType === 'contacts' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selecionar Contatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar contatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Controles de seleção */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllFiltered}
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllFiltered}
                    >
                      Desmarcar Todos
                    </Button>
                  </div>
                  <Badge variant="secondary">
                    {selectedContacts.length} selecionados
                  </Badge>
                </div>

                {/* Lista de contatos */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção por lista (placeholder) */}
          {recipientType === 'list' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Seleção por lista será implementada em breve</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar etapa 2: Configurações
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="messageDelay">Delay entre Mensagens (segundos)</Label>
        <Input
          id="messageDelay"
          type="number"
          min="1"
          max="60"
          value={messageDelay}
          onChange={(e) => setMessageDelay(Number(e.target.value))}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Tempo de espera entre o envio de cada mensagem (1-60 segundos)
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isScheduled"
            checked={isScheduled}
            onCheckedChange={setIsScheduled}
          />
          <Label htmlFor="isScheduled">Agendar disparo</Label>
        </div>

        {isScheduled && (
          <div>
            <Label>Data e Hora do Envio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledAt ? (
                    format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  ) : (
                    <span>Selecionar data e hora</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledAt}
                  onSelect={setScheduledAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar etapa 3: Mensagem
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          ref={messageTextareaRef}
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
          className="mt-1 min-h-[200px]"
        />
        <p className="text-sm text-gray-500 mt-1">
          Use as variáveis abaixo para personalizar a mensagem
        </p>
      </div>

      {/* Variáveis disponíveis */}
      <div>
        <Label className="text-base font-medium">Variáveis Disponíveis</Label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {AVAILABLE_VARIABLES.map((variable) => (
            <Button
              key={variable.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertVariable(variable.key)}
              className="justify-start h-auto p-3"
            >
              <div className="text-left">
                <div className="font-medium">{variable.label}</div>
                <div className="text-xs text-gray-500">{variable.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Preview da mensagem */}
      {message && (
        <div>
          <Label className="text-base font-medium">Preview da Mensagem</Label>
          <Card className="mt-3">
            <CardContent className="pt-4">
              <div className="whitespace-pre-wrap text-sm">
                {message.replace(/\{(\w+)\}/g, (match, variable) => {
                  const varInfo = AVAILABLE_VARIABLES.find(v => v.key === variable);
                  return varInfo ? `[${varInfo.label}]` : match;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Renderizar conteúdo da etapa atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  // Títulos das etapas
  const stepTitles = [
    'Nome e Destinatários',
    'Configurações',
    'Mensagem'
  ];

  const stepIcons = [Users, Settings, Type];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {React.createElement(stepIcons[currentStep - 1], { className: "h-5 w-5" })}
            <span>Criar Disparo - {stepTitles[currentStep - 1]}</span>
          </DialogTitle>
          <DialogDescription>
            Etapa {currentStep} de 3: {stepTitles[currentStep - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progresso */}
        <div className="flex items-center space-x-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Conteúdo da etapa */}
        <div className="space-y-6">
          {renderCurrentStep()}
        </div>

        {/* Botões de navegação */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!validateStep(3) || loading}
              >
                {loading ? 'Criando...' : 'Criar Disparo'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}