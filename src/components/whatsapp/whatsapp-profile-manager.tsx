'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  MessageSquare, 
  Camera, 
  Save, 
  Upload, 
  CheckCircle, 
  XCircle,
  Loader2,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { whatsappProfileService, type WhatsAppProfile } from '@/lib/whatsapp-profile';
import toast from 'react-hot-toast';

interface WhatsAppProfileManagerProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppProfileManager({ instanceKey, instanceName }: WhatsAppProfileManagerProps) {
  const [profile, setProfile] = useState<WhatsAppProfile>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Carregar configurações salvas
  useEffect(() => {
    loadProfileSettings();
  }, [instanceKey]);

  const loadProfileSettings = async () => {
    try {
      setLoading(true);
      const result = await whatsappProfileService.loadProfileSettings(instanceKey);
      
      if (result.success && result.data) {
        setProfile({
          name: result.data.profile_name,
          status: result.data.profile_status,
          pictureUrl: result.data.profile_picture_url
        });
        setProfilePicture(result.data.profile_picture_url);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Salvar configurações no banco local
      const saveResult = await whatsappProfileService.saveProfileSettings(instanceKey, profile);
      
      if (!saveResult.success) {
        throw new Error(saveResult.message);
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!profile.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const result = await whatsappProfileService.updateProfileName(instanceKey, profile.name);
      
      if (result.success) {
        toast.success('Nome do perfil atualizado no WhatsApp!');
        await handleSaveProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      toast.error(error.message || 'Erro ao atualizar nome');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!profile.status) {
      toast.error('Status é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const result = await whatsappProfileService.updateProfileStatus(instanceKey, profile.status);
      
      if (result.success) {
        toast.success('Status do perfil atualizado no WhatsApp!');
        await handleSaveProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Imagem muito grande (máx. 5MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }

    try {
      setUploadingPicture(true);
      
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/...;base64,
        
        // Atualizar no WhatsApp
        const result = await whatsappProfileService.updateProfilePictureBase64(instanceKey, base64Data);
        
        if (result.success) {
          setProfilePicture(base64);
          setProfile(prev => ({ ...prev, pictureUrl: base64 }));
          toast.success('Foto do perfil atualizada no WhatsApp!');
          await handleSaveProfile();
        } else {
          throw new Error(result.message);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      toast.error(error.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handlePictureUrlUpdate = async () => {
    if (!profile.pictureUrl) {
      toast.error('URL da imagem é obrigatória');
      return;
    }

    try {
      setSaving(true);
      const result = await whatsappProfileService.updateProfilePictureUrl(instanceKey, profile.pictureUrl);
      
      if (result.success) {
        setProfilePicture(profile.pictureUrl);
        toast.success('Foto do perfil atualizada no WhatsApp!');
        await handleSaveProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar foto:', error);
      toast.error(error.message || 'Erro ao atualizar foto');
    } finally {
      setSaving(false);
    }
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
            <Settings className="h-5 w-5" />
            Gestão de Perfil WhatsApp
          </CardTitle>
          <CardDescription>
            Configure nome, status e foto do seu perfil WhatsApp
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Status
              </TabsTrigger>
              <TabsTrigger value="picture" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome do Perfil
                  </label>
                  <Input
                    value={profile.name || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite seu nome"
                    maxLength={25}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 25 caracteres
                  </p>
                </div>
                
                <Button 
                  onClick={handleUpdateName}
                  disabled={saving || !profile.name}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Atualizar Nome no WhatsApp
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status do Perfil
                  </label>
                  <Textarea
                    value={profile.status || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, status: e.target.value }))}
                    placeholder="Digite seu status..."
                    maxLength={139}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {profile.status?.length || 0}/139 caracteres
                  </p>
                </div>
                
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={saving || !profile.status}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Atualizar Status no WhatsApp
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="picture" className="space-y-4">
              <div className="space-y-4">
                {/* Preview da foto atual */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profilePicture || undefined} />
                    <AvatarFallback>
                      <ImageIcon className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Foto Atual</p>
                    <p className="text-xs text-gray-500">
                      {profilePicture ? 'Foto configurada' : 'Nenhuma foto'}
                    </p>
                  </div>
                </div>

                {/* Upload de arquivo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload de Arquivo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                      id="picture-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('picture-upload')?.click()}
                      disabled={uploadingPicture}
                      className="flex-1"
                    >
                      {uploadingPicture ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Selecionar Imagem
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>

                {/* URL da imagem */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ou use uma URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={profile.pictureUrl || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, pictureUrl: e.target.value }))}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handlePictureUrlUpdate}
                      disabled={saving || !profile.pictureUrl}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
