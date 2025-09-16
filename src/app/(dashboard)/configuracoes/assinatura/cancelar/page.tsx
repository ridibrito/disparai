import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Cancelar Assinatura - disparai',
};

export default function CancelarAssinaturaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancelar Assinatura</h1>
          <p className="text-gray-600">Gerencie o cancelamento da sua assinatura</p>
        </div>
        <BackButton />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-700">
        Em breve: confirmação do cancelamento e consequências no plano.
      </div>
    </div>
  );
}


