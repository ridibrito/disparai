// Serviço para funcionalidades específicas WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface ValidationResult {
  number: string;
  isOnWhatsApp: boolean;
  isBusiness: boolean;
  profileName?: string;
  profilePicture?: string;
  lastSeen?: string;
}

export interface MediaDownloadResult {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

export interface SpecificFeaturesResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppSpecificFeaturesService {
  private supabase = createClientComponentClient();

  /**
   * Validar se número está no WhatsApp
   */
  async validateWhatsAppNumber(instanceKey: string, phoneNumber: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('📱 Validando número WhatsApp:', { instanceKey, phoneNumber });

      const response = await fetch('/api/mega/validate-whatsapp-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          phoneNumber
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao validar número');
      }

      console.log('✅ Número validado');
      return {
        success: true,
        message: 'Número validado com sucesso',
        data: result.data
      };
    } catch (error: any) {
      console.error('❌ Erro ao validar número:', error);
      return {
        success: false,
        message: error.message || 'Erro ao validar número'
      };
    }
  }

  /**
   * Validar múltiplos números
   */
  async validateMultipleNumbers(instanceKey: string, phoneNumbers: string[]): Promise<SpecificFeaturesResult> {
    try {
      console.log('📱 Validando múltiplos números:', { instanceKey, count: phoneNumbers.length });

      const results = await Promise.all(
        phoneNumbers.map(number => this.validateWhatsAppNumber(instanceKey, number))
      );

      const validNumbers = results
        .filter(result => result.success && result.data?.isOnWhatsApp)
        .map(result => result.data);

      const invalidNumbers = results
        .filter(result => result.success && !result.data?.isOnWhatsApp)
        .map(result => result.data);

      console.log('✅ Múltiplos números validados');
      return {
        success: true,
        message: 'Números validados com sucesso',
        data: {
          valid: validNumbers,
          invalid: invalidNumbers,
          total: phoneNumbers.length,
          validCount: validNumbers.length,
          invalidCount: invalidNumbers.length
        }
      };
    } catch (error: any) {
      console.error('❌ Erro ao validar múltiplos números:', error);
      return {
        success: false,
        message: error.message || 'Erro ao validar números'
      };
    }
  }

  /**
   * Baixar mídia de mensagem
   */
  async downloadMedia(instanceKey: string, messageId: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('📥 Baixando mídia:', { instanceKey, messageId });

      const response = await fetch('/api/mega/download-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          messageId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao baixar mídia');
      }

      console.log('✅ Mídia baixada');
      return {
        success: true,
        message: 'Mídia baixada com sucesso',
        data: result.data
      };
    } catch (error: any) {
      console.error('❌ Erro ao baixar mídia:', error);
      return {
        success: false,
        message: error.message || 'Erro ao baixar mídia'
      };
    }
  }

  /**
   * Obter informações de mídia
   */
  async getMediaInfo(instanceKey: string, messageId: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('ℹ️ Obtendo informações de mídia:', { instanceKey, messageId });

      const response = await fetch('/api/mega/get-media-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          messageId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter informações de mídia');
      }

      console.log('✅ Informações de mídia obtidas');
      return {
        success: true,
        message: 'Informações obtidas com sucesso',
        data: result.data
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter informações de mídia:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter informações de mídia'
      };
    }
  }

  /**
   * Salvar validação no banco
   */
  async saveValidation(instanceKey: string, validation: ValidationResult): Promise<SpecificFeaturesResult> {
    try {
      console.log('💾 Salvando validação:', { instanceKey, validation });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_number_validations')
        .upsert({
          user_id: user.id,
          instance_key: instanceKey,
          phone_number: validation.number,
          is_on_whatsapp: validation.isOnWhatsApp,
          is_business: validation.isBusiness,
          profile_name: validation.profileName,
          profile_picture: validation.profilePicture,
          last_seen: validation.lastSeen,
          validated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Validação salva');
      return {
        success: true,
        message: 'Validação salva com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar validação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar validação'
      };
    }
  }

  /**
   * Carregar validações salvas
   */
  async loadValidations(instanceKey: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('📂 Carregando validações:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_number_validations')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('validated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Validações carregadas');
      return {
        success: true,
        message: 'Validações carregadas com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar validações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar validações'
      };
    }
  }

  /**
   * Salvar download de mídia
   */
  async saveMediaDownload(instanceKey: string, download: MediaDownloadResult): Promise<SpecificFeaturesResult> {
    try {
      console.log('💾 Salvando download de mídia:', { instanceKey, download });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_media_downloads')
        .insert({
          user_id: user.id,
          instance_key: instanceKey,
          message_id: download.messageId,
          media_type: download.mediaType,
          file_name: download.fileName,
          file_size: download.fileSize,
          mime_type: download.mimeType,
          download_url: download.downloadUrl,
          thumbnail_url: download.thumbnailUrl,
          downloaded_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Download de mídia salvo');
      return {
        success: true,
        message: 'Download salvo com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar download:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar download'
      };
    }
  }

  /**
   * Carregar downloads de mídia
   */
  async loadMediaDownloads(instanceKey: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('📂 Carregando downloads de mídia:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_media_downloads')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('downloaded_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Downloads de mídia carregados');
      return {
        success: true,
        message: 'Downloads carregados com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar downloads:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar downloads'
      };
    }
  }

  /**
   * Deletar validação
   */
  async deleteValidation(validationId: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('🗑️ Deletando validação:', { validationId });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_number_validations')
        .delete()
        .eq('id', validationId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Validação deletada');
      return {
        success: true,
        message: 'Validação deletada com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar validação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar validação'
      };
    }
  }

  /**
   * Deletar download de mídia
   */
  async deleteMediaDownload(downloadId: string): Promise<SpecificFeaturesResult> {
    try {
      console.log('🗑️ Deletando download de mídia:', { downloadId });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_media_downloads')
        .delete()
        .eq('id', downloadId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Download de mídia deletado');
      return {
        success: true,
        message: 'Download deletado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar download:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar download'
      };
    }
  }
}

export const whatsappSpecificFeaturesService = new WhatsAppSpecificFeaturesService();
