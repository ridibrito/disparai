'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  UserCheck, 
  UserX, 
  Globe, 
  Lock,
  Save,
  Loader2,
  Settings,
  Clock,
  MessageSquare,
  Phone,
  Users2
} from 'lucide-react';
import { whatsappPrivacyService, type PrivacySettings } from '@/lib/whatsapp-privacy';
import toast from 'react-hot-toast';

interface WhatsAppPrivacyManagerProps {
  instanceKey: string;
  instanceName?: string;
}

const PRIVACY_OPTIONS = [
  { value: 'everyone', label: 'Todos', icon: Globe, description: 'Qualquer pessoa pode ver' },
  { value: 'contacts', label: 'Contatos', icon: Users, description: 'Apenas seus contatos' },
  { value: 'contacts_except', label: 'Contatos exceto...', icon: UserX, description: 'Contatos exceto alguns' },
  { value: 'nobody', label: 'Ninguém', icon: Lock, description: 'Ninguém pode ver' }
];

const DISAPPEARING_TIMES = [
  { value: 3600, label: '1 hora' },
  { value: 86400, label: '24 horas' },
  { value: 604800, label: '7 dias' },
  { value: 2592000, label: '30 dias' }
];

export function WhatsAppPrivacyManager({ instanceKey, instanceName }: WhatsAppPrivacyManagerProps) {
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar configurações salvas
  useEffect(() => {
    loadPrivacySettings();
  }, [instanceKey]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const result = await whatsappPrivacyService.loadPrivacySettings(instanceKey);
      
      if (result.success && result.data) {
        setSettings({
          lastSeen: result.data.last_seen,
          online: result.data.online,
          profilePicture: result.data.profile_picture,
          status: result.data.status,
          readReceipts: result.data.read_receipts,
          groupsAdd: result.data.groups_add,
          callAdd: result.data.call_add,
          disappearingMode: result.data.disappearing_mode,
          disappearingTime: result.data.disappearing_time
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Salvar configurações no banco local
      const saveResult = await whatsappPrivacyService.savePrivacySettings(instanceKey, settings);
      
      if (!saveResult.success) {
        throw new Error(saveResult.message);
      }

      setHasChanges(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async (type: keyof PrivacySettings, value: any) => {
    try {
      setSaving(true);
      
      // Atualizar no WhatsApp
      let result;
      switch (type) {
        case 'lastSeen':
          result = await whatsappPrivacyService.updateLastSeen(instanceKey, value);
          break;
        case 'online':
          result = await whatsappPrivacyService.updateOnline(instanceKey, value);
          break;
        case 'profilePicture':
          result = await whatsappPrivacyService.updateProfilePicture(instanceKey, value);
          break;
        case 'status':
          result = await whatsappPrivacyService.updateStatus(instanceKey, value);
          break;
        case 'readReceipts':
          result = await whatsappPrivacyService.updateReadReceipts(instanceKey, value);
          break;
        case 'groupsAdd':
          result = await whatsappPrivacyService.updateGroupsAdd(instanceKey, value);
          break;
        case 'callAdd':
          result = await whatsappPrivacyService.updateCallAdd(instanceKey, value);
          break;
        case 'disappearingMode':
          result = await whatsappPrivacyService.updateDisappearingMode(instanceKey, value, settings.disappearingTime);
          break;
        default:
          throw new Error('Tipo de configuração não suportado');
      }
      
      if (result.success) {
        setSettings(prev => ({ ...prev, [type]: value }));
        setHasChanges(true);
        toast.success('Configuração atualizada no WhatsApp!');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error(error.message || 'Erro ao atualizar configuração');
    } finally {
      setSaving(false);
    }
  };

  const getPrivacyIcon = (value: string) => {
    const option = PRIVACY_OPTIONS.find(opt => opt.value === value);
    return option ? option.icon : Globe;
  };

  const getPrivacyLabel = (value: string) => {
    const option = PRIVACY_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : 'Todos';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Privacidade
          </CardTitle>
          <CardDescription>
            Gerencie quem pode ver suas informações no WhatsApp
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Última vez visto */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <label className="text-sm font-medium">Última vez visto</label>
            </div>
            <Select
              value={settings.lastSeen || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('lastSeen', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status online */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <label className="text-sm font-medium">Status online</label>
            </div>
            <Select
              value={settings.online || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('online', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Foto do perfil */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <label className="text-sm font-medium">Foto do perfil</label>
            </div>
            <Select
              value={settings.profilePicture || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('profilePicture', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <label className="text-sm font-medium">Status</label>
            </div>
            <Select
              value={settings.status || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('status', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirmação de leitura */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <label className="text-sm font-medium">Confirmação de leitura</label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Enviar confirmações de leitura</div>
                <div className="text-xs text-gray-500">
                  {settings.readReceipts ? 'Ativado' : 'Desativado'}
                </div>
              </div>
              <Switch
                checked={settings.readReceipts ?? true}
                onCheckedChange={(checked) => handlePrivacyUpdate('readReceipts', checked)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Adicionar a grupos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              <label className="text-sm font-medium">Adicionar a grupos</label>
            </div>
            <Select
              value={settings.groupsAdd || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('groupsAdd', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adicionar a chamadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <label className="text-sm font-medium">Adicionar a chamadas</label>
            </div>
            <Select
              value={settings.callAdd || 'everyone'}
              onValueChange={(value) => handlePrivacyUpdate('callAdd', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mensagens temporárias */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <label className="text-sm font-medium">Mensagens temporárias</label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Ativar mensagens temporárias</div>
                  <div className="text-xs text-gray-500">
                    {settings.disappearingMode ? 'Ativado' : 'Desativado'}
                  </div>
                </div>
                <Switch
                  checked={settings.disappearingMode ?? false}
                  onCheckedChange={(checked) => handlePrivacyUpdate('disappearingMode', checked)}
                  disabled={saving}
                />
              </div>
              
              {settings.disappearingMode && (
                <Select
                  value={settings.disappearingTime?.toString() || '86400'}
                  onValueChange={(value) => {
                    const time = parseInt(value);
                    setSettings(prev => ({ ...prev, disappearingTime: time }));
                    handlePrivacyUpdate('disappearingMode', true);
                  }}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISAPPEARING_TIMES.map((time) => (
                      <SelectItem key={time.value} value={time.value.toString()}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Botão salvar */}
          {hasChanges && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
