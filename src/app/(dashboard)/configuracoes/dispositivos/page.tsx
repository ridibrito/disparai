import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Dispositivos - disparai',
};

export default function DispositivosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispositivos</h1>
          <p className="text-gray-600">Gerencie seus dispositivos conectados</p>
        </div>
        <BackButton />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-700">
        Em breve: status de conexão e gerenciamento de dispositivos.
      </div>
    </div>
  );
}


