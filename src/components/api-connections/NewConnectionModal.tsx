'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Zap, Plus, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import SimpleWhatsAppConnection from './SimpleWhatsAppConnection';

interface NewConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: any) => void;
}

const connectionTypes = [
  {
    id: 'whatsapp_disparai',
    name: 'WhatsApp Business',
    description: 'Conecte seu WhatsApp para enviar mensagens em massa',
    icon: Zap,
    color: 'bg-green-500',
    features: [
      'Mensagens ilimitadas',
      'Envio de mídia (imagens, vídeos, documentos)',
      'Conexão automática e segura',
      'Pronto para usar em segundos',
      'Suporte 24/7'
    ],
    requirements: [
      'Apenas escaneie o QR Code com seu WhatsApp',
      'Conexão automática e segura',
      'Pronto para usar em segundos'
    ]
  }
];

export default function NewConnectionModal({ isOpen, onClose, onSave }: NewConnectionModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [connectionName, setConnectionName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instanceKey, setInstanceKey] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [description, setDescription] = useState('');

  const selectedTypeInfo = connectionTypes.find(type => type.id === selectedType);

  const validateConnection = async () => {
    if (!selectedType || !apiToken) {
      toast.error('Selecione o tipo de conexão e forneça o Token de Acesso');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      let result;
      
      if (selectedType === 'whatsapp_cloud') {
        if (!phoneNumber) {
          toast.error('Phone Number ID é obrigatório para WhatsApp Cloud API');
          return;
        }
        
        const response = await fetch('/api/connections/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'whatsapp_cloud',
            phoneNumber,
            apiKey: apiToken,
          }),
        });
        
        result = await response.json();
      } else if (selectedType === 'whatsapp_disparai') {
        if (!instanceKey) {
          toast.error('Instance Key é obrigatória para API Disparai');
          return;
        }
        
        const response = await fetch('/api/connections/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'whatsapp_disparai',
            instanceKey,
            apiKey: apiToken,
          }),
        });
        
        result = await response.json();
      }

      setValidationResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Erro ao validar conexão');
      setValidationResult({
        success: false,
        message: 'Erro ao validar conexão'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    const connection = {
      id: Date.now().toString(),
      name: connectionName,
      type: selectedType,
      status: 'active',
      phoneNumber: selectedType === 'whatsapp_cloud' ? phoneNumber : undefined,
      instanceId: selectedType === 'whatsapp_disparai' ? instanceKey : undefined,
      apiKey: apiToken,
      apiSecret,
      webhookUrl,
      description,
      createdAt: new Date().toISOString(),
      messageCount: 0,
      monthlyLimit: 5000
    };

    onSave(connection);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedType('');
    setConnectionName('');
    setPhoneNumber('');
    setInstanceKey('');
    setApiToken('');
    setApiSecret('');
    setWebhookUrl('');
    setDescription('');
  };

  const isFormValid = () => {
    if (!selectedType || !connectionName || !apiToken) return false;
    
    if (selectedType === 'whatsapp_cloud' && !phoneNumber) return false;
    if (selectedType === 'whatsapp_disparai' && !instanceKey) return false;
    
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conexão API</DialogTitle>
          <DialogDescription>
            Configure uma nova conexão com WhatsApp Cloud API ou WhatsApp Disparai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do tipo de conexão */}
          <div>
            <Label className="text-base font-medium">Tipo de Conexão</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {connectionTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${type.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          <CardDescription>{type.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Recursos incluídos:</p>
                          <div className="space-y-1">
                            {type.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-gray-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Requisitos:</p>
                          <div className="space-y-1">
                            {type.requirements.map((requirement, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <AlertCircle className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-600">{requirement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Conexão simplificada - sempre ativa para WhatsApp */}
          {selectedType === 'whatsapp_disparai' && (
            <SimpleWhatsAppConnection
              userId="current_user" // Será passado do contexto
              userName="Usuário"
              onConnected={() => {
                toast.success('WhatsApp conectado com sucesso!');
                onClose();
              }}
              onError={(error) => {
                toast.error('Erro: ' + error);
              }}
            />
          )}

          {/* Configurações da conexão - removido para simplificar */}
          {false && selectedType && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="connectionName">Nome da Conexão *</Label>
                  <Input
                    id="connectionName"
                    placeholder="Ex: WhatsApp Principal"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                  />
                </div>

                {selectedType === 'whatsapp_cloud' && (
                  <div>
                    <Label htmlFor="phoneNumber">Número de Telefone *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+55 11 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                )}

                {selectedType === 'whatsapp_disparai' && (
                  <div>
                    <Label htmlFor="instanceId">Instance Key *</Label>
                    <Input
                      id="instanceId"
                      placeholder="INST_001"
                      value={instanceKey}
                      onChange={(e) => setInstanceKey(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiToken">Token de Acesso *</Label>
                  <Input
                    id="apiToken"
                    placeholder="Cole seu Token de Acesso aqui"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    placeholder="Cole sua API Secret aqui"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://seu-dominio.com/api/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL para receber notificações em tempo real
                </p>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito desta conexão..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Botão de validação */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateConnection}
                  disabled={isValidating || !selectedType || !apiToken}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validar Conexão
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}

          {/* Resumo da configuração */}
          {selectedType && selectedTypeInfo && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <Badge className={`${selectedTypeInfo.color} text-white`}>
                      {selectedTypeInfo.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium">{connectionName || 'Não definido'}</span>
                  </div>
                  {selectedType === 'whatsapp_cloud' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="font-medium">{phoneNumber || 'Não definido'}</span>
                    </div>
                  )}
                  {selectedType === 'whatsapp_disparai' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Instance ID:</span>
                      <span className="font-medium">{instanceKey || 'Não definido'}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Token de Acesso:</span>
                    <span className="font-medium">{apiToken ? '✓ Configurada' : '✗ Não configurada'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isFormValid()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Conexão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
