// Serviço para análise e relatórios WhatsApp via Mega API

export interface AnalyticsData {
  messages: {
    total: number;
    sent: number;
    received: number;
    delivered: number;
    read: number;
    failed: number;
  };
  chats: {
    total: number;
    active: number;
    archived: number;
    blocked: number;
  };
  contacts: {
    total: number;
    new: number;
    active: number;
  };
  performance: {
    responseTime: number;
    deliveryRate: number;
    readRate: number;
  };
  timeline: Array<{
    date: string;
    messages: number;
    chats: number;
  }>;
}

export interface ReportConfig {
  period: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppAnalyticsService {
  /**
   * Obter dados de análise
   */
  async getAnalytics(instanceKey: string, config: ReportConfig): Promise<AnalyticsResult> {
    try {
      console.log('📊 Obtendo dados de análise:', { instanceKey, config });

      const response = await fetch('/api/mega/get-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          config
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Dados de análise obtidos com sucesso',
        data: result.data
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados de análise:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Gerar relatório
   */
  async generateReport(instanceKey: string, config: ReportConfig): Promise<AnalyticsResult> {
    try {
      console.log('📋 Gerando relatório:', { instanceKey, config });

      const response = await fetch('/api/mega/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          config
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Relatório gerado com sucesso',
        data: result.data
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Exportar dados
   */
  async exportData(instanceKey: string, config: ReportConfig, format: 'csv' | 'xlsx' | 'pdf'): Promise<AnalyticsResult> {
    try {
      console.log('📤 Exportando dados:', { instanceKey, config, format });

      const response = await fetch('/api/mega/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          config,
          format
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Dados exportados com sucesso',
        data: result.data
      };
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

export const WhatsAppAnalyticsServiceInstance = new WhatsAppAnalyticsService();