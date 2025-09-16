// Serviço para gerenciar perfil WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface WhatsAppProfile {
  name?: string;
  status?: string;
  picture?: string;
  pictureUrl?: string;
  pictureBase64?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppProfileService {
  private supabase = createClientComponentClient();

  /**
   * Atualizar nome do perfil WhatsApp
   */
  async updateProfileName(instanceKey: string, name: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📝 Atualizando nome do perfil WhatsApp:', { instanceKey, name });

      const response = await fetch('/api/mega/set-profile-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          name
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar nome do perfil');
      }

      console.log('✅ Nome do perfil atualizado com sucesso');
      return {
        success: true,
        message: 'Nome do perfil atualizado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar nome do perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar nome do perfil'
      };
    }
  }

  /**
   * Atualizar status do perfil WhatsApp
   */
  async updateProfileStatus(instanceKey: string, status: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📝 Atualizando status do perfil WhatsApp:', { instanceKey, status });

      const response = await fetch('/api/mega/set-profile-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar status do perfil');
      }

      console.log('✅ Status do perfil atualizado com sucesso');
      return {
        success: true,
        message: 'Status do perfil atualizado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status do perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar status do perfil'
      };
    }
  }

  /**
   * Atualizar foto do perfil WhatsApp (via URL)
   */
  async updateProfilePictureUrl(instanceKey: string, pictureUrl: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📝 Atualizando foto do perfil WhatsApp (URL):', { instanceKey, pictureUrl });

      const response = await fetch('/api/mega/set-profile-picture-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          pictureUrl
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar foto do perfil');
      }

      console.log('✅ Foto do perfil atualizada com sucesso');
      return {
        success: true,
        message: 'Foto do perfil atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar foto do perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar foto do perfil'
      };
    }
  }

  /**
   * Atualizar foto do perfil WhatsApp (via Base64)
   */
  async updateProfilePictureBase64(instanceKey: string, pictureBase64: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📝 Atualizando foto do perfil WhatsApp (Base64)');

      const response = await fetch('/api/mega/set-profile-picture-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          pictureBase64
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar foto do perfil');
      }

      console.log('✅ Foto do perfil atualizada com sucesso');
      return {
        success: true,
        message: 'Foto do perfil atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar foto do perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar foto do perfil'
      };
    }
  }

  /**
   * Obter foto do perfil de qualquer usuário
   */
  async getProfilePicture(instanceKey: string, phoneNumber: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📸 Obtendo foto do perfil:', { instanceKey, phoneNumber });

      const response = await fetch('/api/mega/get-profile-picture', {
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
        throw new Error(result.error || 'Erro ao obter foto do perfil');
      }

      console.log('✅ Foto do perfil obtida com sucesso');
      return {
        success: true,
        message: 'Foto do perfil obtida com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter foto do perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter foto do perfil'
      };
    }
  }

  /**
   * Verificar se número está no WhatsApp
   */
  async isOnWhatsApp(instanceKey: string, phoneNumber: string): Promise<ProfileUpdateResult> {
    try {
      console.log('🔍 Verificando se número está no WhatsApp:', { instanceKey, phoneNumber });

      const response = await fetch('/api/mega/is-on-whatsapp', {
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
        throw new Error(result.error || 'Erro ao verificar número');
      }

      console.log('✅ Verificação concluída');
      return {
        success: true,
        message: 'Verificação concluída',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao verificar número:', error);
      return {
        success: false,
        message: error.message || 'Erro ao verificar número'
      };
    }
  }

  /**
   * Salvar configurações de perfil no banco local
   */
  async saveProfileSettings(instanceKey: string, profile: WhatsAppProfile): Promise<ProfileUpdateResult> {
    try {
      console.log('💾 Salvando configurações de perfil:', { instanceKey, profile });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_profile_settings')
        .upsert({
          user_id: user.id,
          instance_key: instanceKey,
          profile_name: profile.name,
          profile_status: profile.status,
          profile_picture_url: profile.pictureUrl,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Configurações de perfil salvas com sucesso');
      return {
        success: true,
        message: 'Configurações de perfil salvas com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar configurações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar configurações'
      };
    }
  }

  /**
   * Carregar configurações de perfil do banco local
   */
  async loadProfileSettings(instanceKey: string): Promise<ProfileUpdateResult> {
    try {
      console.log('📂 Carregando configurações de perfil:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_profile_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(error.message);
      }

      console.log('✅ Configurações de perfil carregadas');
      return {
        success: true,
        message: 'Configurações carregadas',
        data: data || null
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar configurações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar configurações'
      };
    }
  }
}

export const whatsappProfileService = new WhatsAppProfileService();
