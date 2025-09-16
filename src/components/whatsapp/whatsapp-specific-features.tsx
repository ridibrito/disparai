'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Plus,
  Trash2,
  Eye,
  FileText,
  Image,
  Video,
  Music,
  File,
  Sticker,
  Search,
  Upload
} from 'lucide-react';
import { whatsappSpecificFeaturesService, type ValidationResult, type MediaDownloadResult } from '@/lib/whatsapp-specific-features';
import toast from 'react-hot-toast';

interface WhatsAppSpecificFeaturesProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppSpecificFeatures({ instanceKey, instanceName }: WhatsAppSpecificFeaturesProps) {
  const [activeTab, setActiveTab] = useState('validation');
  const [loading, setLoading] = useState(false);
  
  // Estados para validação de números
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  
  // Estados para download de mídia
  const [messageId, setMessageId] = useState('');
  const [downloads, setDownloads] = useState<MediaDownloadResult[]>([]);

  // Carregar dados salvos
  useEffect(() => {
    loadValidations();
    loadDownloads();
  }, [instanceKey]);

  const loadValidations = async () => {
    try {
      const result = await whatsappSpecificFeaturesService.loadValidations(instanceKey);
      if (result.success && result.data) {
        setValidations(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar validações:', error);
    }
  };

  const loadDownloads = async () => {
    try {
      const result = await whatsappSpecificFeaturesService.loadMediaDownloads(instanceKey);
      if (result.success && result.data) {
        setDownloads(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar downloads:', error);
    }
  };

  const validateSingleNumber = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Digite um número de telefone');
      return;
    }

    try {
      setLoading(true);
      const result = await whatsappSpecificFeaturesService.validateWhatsAppNumber(instanceKey, phoneNumber);
      
      if (result.success && result.data) {
        await whatsappSpecificFeaturesService.saveValidation(instanceKey, result.data);
        await loadValidations();
        toast.success('Número validado com sucesso!');
        setPhoneNumber('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao validar número:', error);
      toast.error(error.message || 'Erro ao validar número');
    } finally {
      setLoading(false);
    }
  };

  const validateMultipleNumbers = async () => {
    if (!phoneNumbers.trim()) {
      toast.error('Digite os números de telefone');
      return;
    }

    const numbers = phoneNumbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (numbers.length === 0) {
      toast.error('Nenhum número válido encontrado');
      return;
    }

    try {
      setLoading(true);
      const result = await whatsappSpecificFeaturesService.validateMultipleNumbers(instanceKey, numbers);
      
      if (result.success && result.data) {
        // Salvar validações válidas
        for (const validation of result.data.valid) {
          await whatsappSpecificFeaturesService.saveValidation(instanceKey, validation);
        }
        
        await loadValidations();
        toast.success(`${result.data.validCount} números válidos de ${result.data.total} total!`);
        setPhoneNumbers('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao validar números:', error);
      toast.error(error.message || 'Erro ao validar números');
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = async () => {
    if (!messageId.trim()) {
      toast.error('Digite o ID da mensagem');
      return;
    }

    try {
      setLoading(true);
      const result = await whatsappSpecificFeaturesService.downloadMedia(instanceKey, messageId);
      
      if (result.success && result.data) {
        await whatsappSpecificFeaturesService.saveMediaDownload(instanceKey, result.data);
        await loadDownloads();
        toast.success('Mídia baixada com sucesso!');
        setMessageId('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao baixar mídia:', error);
      toast.error(error.message || 'Erro ao baixar mídia');
    } finally {
      setLoading(false);
    }
  };

  const deleteValidation = async (validationId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta validação?')) {
      return;
    }

    try {
      const result = await whatsappSpecificFeaturesService.deleteValidation(validationId);
      
      if (result.success) {
        toast.success('Validação deletada com sucesso!');
        await loadValidations();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao deletar validação:', error);
      toast.error(error.message || 'Erro ao deletar validação');
    }
  };

  const deleteDownload = async (downloadId: string) => {
    if (!confirm('Tem certeza que deseja deletar este download?')) {
      return;
    }

    try {
      const result = await whatsappSpecificFeaturesService.deleteMediaDownload(downloadId);
      
      if (result.success) {
        toast.success('Download deletado com sucesso!');
        await loadDownloads();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao deletar download:', error);
      toast.error(error.message || 'Erro ao deletar download');
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'sticker': return <Sticker className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Funcionalidades Específicas
          </CardTitle>
          <CardDescription>
            Validação de números e download de mídias
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Validação de Números
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download de Mídias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="validation" className="mt-6">
              <div className="space-y-6">
                {/* Validação Individual */}
                <Card>
                  <CardHeader>
                    <CardTitle>Validar Número Individual</CardTitle>
                    <CardDescription>
                      Verifique se um número específico está no WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Número de telefone</label>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="5511999999999"
                      />
                    </div>
                    <Button onClick={validateSingleNumber} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Validar Número
                    </Button>
                  </CardContent>
                </Card>

                {/* Validação em Lote */}
                <Card>
                  <CardHeader>
                    <CardTitle>Validar Múltiplos Números</CardTitle>
                    <CardDescription>
                      Valide vários números de uma vez (um por linha)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Números de telefone</label>
                      <Textarea
                        value={phoneNumbers}
                        onChange={(e) => setPhoneNumbers(e.target.value)}
                        placeholder="5511999999999&#10;5511888888888&#10;5511777777777"
                        rows={6}
                      />
                    </div>
                    <Button onClick={validateMultipleNumbers} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Validar Números
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Validações */}
                {validations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Validações Salvas</CardTitle>
                      <CardDescription>
                        Histórico de validações realizadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validations.map((validation) => (
                          <div key={validation.number} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {validation.isOnWhatsApp ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <div>
                                <div className="font-medium">{validation.number}</div>
                                <div className="text-sm text-gray-500">
                                  {validation.profileName || 'Nome não disponível'}
                                  {validation.isBusiness && (
                                    <Badge variant="secondary" className="ml-2">Business</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={validation.isOnWhatsApp ? "default" : "secondary"}>
                                {validation.isOnWhatsApp ? 'Válido' : 'Inválido'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteValidation(validation.number)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="download" className="mt-6">
              <div className="space-y-6">
                {/* Download de Mídia */}
                <Card>
                  <CardHeader>
                    <CardTitle>Baixar Mídia</CardTitle>
                    <CardDescription>
                      Baixe mídias de mensagens específicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">ID da Mensagem</label>
                      <Input
                        value={messageId}
                        onChange={(e) => setMessageId(e.target.value)}
                        placeholder="3EB0C767D26A8F8A3C"
                      />
                    </div>
                    <Button onClick={downloadMedia} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Baixar Mídia
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Downloads */}
                {downloads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Downloads Realizados</CardTitle>
                      <CardDescription>
                        Histórico de mídias baixadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {downloads.map((download) => (
                          <div key={download.messageId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getMediaIcon(download.mediaType)}
                              <div>
                                <div className="font-medium">{download.fileName}</div>
                                <div className="text-sm text-gray-500">
                                  {download.mediaType} • {formatFileSize(download.fileSize)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {download.mediaType}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(download.downloadUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteDownload(download.messageId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
