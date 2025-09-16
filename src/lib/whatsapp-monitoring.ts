// Serviço para monitoramento e status WhatsApp via Mega API

export interface InstanceStatus {
  instanceKey: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  qrCode?: string;
  pairingCode?: string;
  lastSeen?: string;
  batteryLevel?: number;
  isOnline?: boolean;
  phoneNumber?: string;
  profileName?: string;
  profilePicture?: string;
}

export interface MonitoringResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppMonitoringService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private callbacks: ((status: InstanceStatus) => void)[] = [];

  /**
   * Obter status da instância
   */
  async getInstanceStatus(instanceKey: string): Promise<MonitoringResult> {
    try {
      console.log('📊 Obtendo status da instância:', { instanceKey });

      const response = await fetch('/api/mega/get-instance-status', {
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
        throw new Error(result.error || 'Erro ao obter status da instância');
      }

      console.log('✅ Status da instância obtido');
      return {
        success: true,
        message: 'Status obtido com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter status'
      };
    }
  }

  /**
   * Obter QR Code para conexão
   */
  async getQRCode(instanceKey: string): Promise<MonitoringResult> {
    try {
      console.log('📱 Obtendo QR Code:', { instanceKey });

      const response = await fetch('/api/mega/get-qr-code', {
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
        throw new Error(result.error || 'Erro ao obter QR Code');
      }

      console.log('✅ QR Code obtido');
      return {
        success: true,
        message: 'QR Code obtido com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter QR Code'
      };
    }
  }

  /**
   * Obter código de pareamento
   */
  async getPairingCode(instanceKey: string): Promise<MonitoringResult> {
    try {
      console.log('🔗 Obtendo código de pareamento:', { instanceKey });

      const response = await fetch('/api/mega/get-pairing-code', {
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
        throw new Error(result.error || 'Erro ao obter código de pareamento');
      }

      console.log('✅ Código de pareamento obtido');
      return {
        success: true,
        message: 'Código de pareamento obtido com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter código de pareamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter código de pareamento'
      };
    }
  }

  /**
   * Obter informações do dispositivo
   */
  async getDeviceInfo(instanceKey: string): Promise<MonitoringResult> {
    try {
      console.log('📱 Obtendo informações do dispositivo:', { instanceKey });

      const response = await fetch('/api/mega/get-device-info', {
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
        throw new Error(result.error || 'Erro ao obter informações do dispositivo');
      }

      console.log('✅ Informações do dispositivo obtidas');
      return {
        success: true,
        message: 'Informações obtidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter informações do dispositivo:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter informações do dispositivo'
      };
    }
  }

  /**
   * Iniciar monitoramento em tempo real
   */
  startMonitoring(instanceKey: string, intervalMs: number = 10000): void {
    console.log('🔄 Iniciando monitoramento automático:', { instanceKey, intervalMs });

    // Carregar status inicial imediatamente
    this.getInstanceStatus(instanceKey).then(result => {
      if (result.success && result.data) {
        const status: InstanceStatus = {
          instanceKey,
          status: result.data.status || 'disconnected',
          qrCode: result.data.qrCode,
          pairingCode: result.data.pairingCode,
          lastSeen: result.data.lastSeen,
          batteryLevel: result.data.batteryLevel,
          isOnline: result.data.isOnline,
          phoneNumber: result.data.phoneNumber,
          profileName: result.data.profileName,
          profilePicture: result.data.profilePicture
        };

        // Notificar callbacks sobre status inicial
        this.callbacks.forEach(callback => callback(status));
      }
    }).catch(error => {
      console.error('❌ Erro no status inicial:', error);
    });

    // Iniciar monitoramento contínuo
    this.monitoringInterval = setInterval(async () => {
      try {
        const result = await this.getInstanceStatus(instanceKey);
        if (result.success && result.data) {
          const status: InstanceStatus = {
            instanceKey,
            status: result.data.status || 'disconnected',
            qrCode: result.data.qrCode,
            pairingCode: result.data.pairingCode,
            lastSeen: result.data.lastSeen,
            batteryLevel: result.data.batteryLevel,
            isOnline: result.data.isOnline,
            phoneNumber: result.data.phoneNumber,
            profileName: result.data.profileName,
            profilePicture: result.data.profilePicture
          };

          // Notificar callbacks
          this.callbacks.forEach(callback => callback(status));
        }
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
      }
    }, intervalMs);
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('⏹️ Parando monitoramento');
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Adicionar callback para mudanças de status
   */
  onStatusChange(callback: (status: InstanceStatus) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remover callback
   */
  removeStatusCallback(callback: (status: InstanceStatus) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Salvar status (versão simplificada - apenas em memória)
   */
  async saveInstanceStatus(instanceKey: string, status: InstanceStatus): Promise<MonitoringResult> {
    try {
      console.log('💾 Status da instância atualizado:', { instanceKey, status });
      
      // Notificar callbacks sobre mudança de status
      this.callbacks.forEach(callback => callback(status));
      
      return {
        success: true,
        message: 'Status atualizado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Carregar status da instância (versão simplificada)
   */
  async loadInstanceStatus(instanceKey: string): Promise<MonitoringResult> {
    try {
      console.log('📂 Carregando status da instância:', { instanceKey });
      
      // Usar a API para obter status em tempo real
      return await this.getInstanceStatus(instanceKey);
    } catch (error: any) {
      console.error('❌ Erro ao carregar status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar status'
      };
    }
  }
}

export const whatsappMonitoringService = new WhatsAppMonitoringService();
