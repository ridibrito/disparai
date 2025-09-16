// Serviço para gerenciar configurações de privacidade WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface PrivacySettings {
  lastSeen?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  online?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  profilePicture?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  status?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  readReceipts?: boolean;
  groupsAdd?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  callAdd?: 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
  disappearingMode?: boolean;
  disappearingTime?: number; // em segundos
}

export interface PrivacyUpdateResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppPrivacyService {
  private supabase = createClientComponentClient();

  /**
   * Obter todas as configurações de privacidade
   */
  async getPrivacySettings(instanceKey: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Obtendo configurações de privacidade:', { instanceKey });

      const response = await fetch('/api/mega/get-privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter configurações de privacidade');
      }

      console.log('✅ Configurações de privacidade obtidas');
      return {
        success: true,
        message: 'Configurações obtidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter configurações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter configurações'
      };
    }
  }

  /**
   * Atualizar configuração de "última vez visto"
   */
  async updateLastSeen(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando última vez visto:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-last-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar última vez visto');
      }

      console.log('✅ Última vez visto atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar última vez visto:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de "online"
   */
  async updateOnline(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando status online:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar status online');
      }

      console.log('✅ Status online atualizado');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status online:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de foto do perfil
   */
  async updateProfilePicture(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando privacidade da foto:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-profile-picture-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar privacidade da foto');
      }

      console.log('✅ Privacidade da foto atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar privacidade da foto:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de status
   */
  async updateStatus(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando privacidade do status:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-status-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar privacidade do status');
      }

      console.log('✅ Privacidade do status atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar privacidade do status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de confirmação de leitura
   */
  async updateReadReceipts(instanceKey: string, enabled: boolean): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando confirmação de leitura:', { instanceKey, enabled });

      const response = await fetch('/api/mega/update-read-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          enabled
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar confirmação de leitura');
      }

      console.log('✅ Confirmação de leitura atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar confirmação de leitura:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de adicionar a grupos
   */
  async updateGroupsAdd(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando configuração de grupos:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-groups-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar configuração de grupos');
      }

      console.log('✅ Configuração de grupos atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar configuração de grupos:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar configuração de adicionar a chamadas
   */
  async updateCallAdd(instanceKey: string, setting: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando configuração de chamadas:', { instanceKey, setting });

      const response = await fetch('/api/mega/update-call-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          setting
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar configuração de chamadas');
      }

      console.log('✅ Configuração de chamadas atualizada');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar configuração de chamadas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Atualizar modo de mensagens temporárias
   */
  async updateDisappearingMode(instanceKey: string, enabled: boolean, time?: number): Promise<PrivacyUpdateResult> {
    try {
      console.log('🔒 Atualizando modo temporário:', { instanceKey, enabled, time });

      const response = await fetch('/api/mega/update-disappearing-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          enabled,
          time
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar modo temporário');
      }

      console.log('✅ Modo temporário atualizado');
      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar modo temporário:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar configuração'
      };
    }
  }

  /**
   * Salvar configurações de privacidade no banco local
   */
  async savePrivacySettings(instanceKey: string, settings: PrivacySettings): Promise<PrivacyUpdateResult> {
    try {
      console.log('💾 Salvando configurações de privacidade:', { instanceKey, settings });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_privacy_settings')
        .upsert({
          user_id: user.id,
          instance_key: instanceKey,
          last_seen: settings.lastSeen,
          online: settings.online,
          profile_picture: settings.profilePicture,
          status: settings.status,
          read_receipts: settings.readReceipts,
          groups_add: settings.groupsAdd,
          call_add: settings.callAdd,
          disappearing_mode: settings.disappearingMode,
          disappearing_time: settings.disappearingTime,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Configurações de privacidade salvas');
      return {
        success: true,
        message: 'Configurações salvas com sucesso'
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
   * Carregar configurações de privacidade do banco local
   */
  async loadPrivacySettings(instanceKey: string): Promise<PrivacyUpdateResult> {
    try {
      console.log('📂 Carregando configurações de privacidade:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(error.message);
      }

      console.log('✅ Configurações de privacidade carregadas');
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

export const whatsappPrivacyService = new WhatsAppPrivacyService();
