// TODO: Integrar componentes de assinatura quando a API estiver pronta

export const metadata = {
  title: 'Assinatura - Configurações - DisparaMaker',
  description: 'Gerencie seu plano e pagamentos',
};

export default function AssinaturaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assinatura</h1>
        <p className="text-gray-600">Gerencie seu plano atual e explore outras opções.</p>
      </div>

      {/* Plano Atual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plano Atual</h2>
        <p className="text-gray-600">Informações da assinatura estarão disponíveis em breve.</p>
      </div>

      {/* Planos Disponíveis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Planos Disponíveis</h2>
        <p className="text-gray-600">Seleção de planos será adicionada em breve.</p>
      </div>
    </div>
  );
}
