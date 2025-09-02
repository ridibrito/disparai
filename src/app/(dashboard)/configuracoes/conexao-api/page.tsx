import { ApiCredentialsForm } from '@/components/api/api-credentials-form';
import ApiCredentialsTable from '@/components/api/api-credentials-table';

export const metadata = {
  title: 'Conexão API - Configurações - disparai',
  description: 'Configure sua API do WhatsApp',
};

export default function ConexaoApiPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conexão API</h1>
        <p className="text-gray-600">Configure sua API do WhatsApp para enviar mensagens.</p>
      </div>

      {/* API Credentials Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Nova Conexão</h2>
        <ApiCredentialsForm />
      </div>

      {/* API Credentials Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Conexões Configuradas</h2>
        <ApiCredentialsTable initialCredentials={[]} />
      </div>
    </div>
  );
}
