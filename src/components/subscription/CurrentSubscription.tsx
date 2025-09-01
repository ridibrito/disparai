'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

type SubscriptionDetails = {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  planName: string;
  planPrice: number;
  interval: 'month' | 'year';
};

type CurrentSubscriptionProps = {
  subscription: SubscriptionDetails;
  onManagePaymentMethod: () => void;
  onCancelSubscription: () => void;
  onReactivateSubscription: () => void;
};

export default function CurrentSubscription({
  subscription,
  onManagePaymentMethod,
  onCancelSubscription,
  onReactivateSubscription
}: CurrentSubscriptionProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ativa
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Período de Teste
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pagamento Pendente
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Cancelada
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pagamento Falhou
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Incompleta
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Sua Assinatura</h2>
      
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{subscription.planName}</h3>
            <div className="mt-1 flex items-center space-x-2">
              {getStatusBadge(subscription.status)}
              
              {subscription.cancelAtPeriodEnd && (
                <span className="text-sm text-gray-500">
                  (Será cancelada em {formatDate(subscription.currentPeriodEnd)})
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">R$ {subscription.planPrice.toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              /{subscription.interval === 'month' ? 'mês' : 'ano'}
            </p>
          </div>
        </div>
        
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Sua próxima cobrança será em {formatDate(subscription.currentPeriodEnd)}.
            </p>
          </div>
        )}
        
        {(subscription.status === 'past_due' || subscription.status === 'unpaid') && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              Detectamos um problema com seu método de pagamento.
            </p>
            <p className="text-sm text-red-700 mt-1">
              Por favor, atualize suas informações de pagamento para evitar a interrupção do serviço.
            </p>
            <button
              onClick={onManagePaymentMethod}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Atualizar Método de Pagamento
            </button>
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onManagePaymentMethod}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Gerenciar Método de Pagamento
            </button>
            
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Cancelar Assinatura
              </button>
            ) : subscription.cancelAtPeriodEnd ? (
              <button
                onClick={onReactivateSubscription}
                className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                Reativar Assinatura
              </button>
            ) : null}
          </div>
        </div>
        
        {showCancelConfirm && (
          <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Tem certeza que deseja cancelar?</h4>
            <p className="text-sm text-red-700 mb-4">
              Sua assinatura permanecerá ativa até o final do período atual, em {formatDate(subscription.currentPeriodEnd)}.
              Após essa data, você perderá acesso aos recursos premium.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Confirmar Cancelamento
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}