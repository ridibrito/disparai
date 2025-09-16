import SimpleConnectionsTabs from '@/components/api-connections/SimpleConnectionsTabs';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Conexões API - Configurações - disparai',
  description: 'Gerencie suas conexões com WhatsApp Cloud API e WhatsApp Disparai',
};

export default function ConexaoApiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conexões API</h1>
          <p className="text-gray-600">Gerencie suas conexões com WhatsApp Cloud API e WhatsApp Disparai</p>
        </div>
        <BackButton />
      </div>
      <SimpleConnectionsTabs />
    </div>
  );
}
