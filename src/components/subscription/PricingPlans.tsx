'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

type PricingPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
  contactLimit: number;
  deviceLimit: number;
  campaignLimit: number;
};

type PricingPlansProps = {
  plans: PricingPlan[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
};

export default function PricingPlans({ plans, currentPlanId, onSelectPlan }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  const filteredPlans = plans.filter(plan => plan.interval === billingInterval);
  
  return (
    <div className="w-full">
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${billingInterval === 'month' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${billingInterval === 'year' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Anual <span className="text-xs text-green-600 ml-1">-20%</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => (
          <div 
            key={plan.id}
            className={`rounded-lg overflow-hidden border ${plan.highlighted ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
          >
            <div className={`p-6 ${plan.highlighted ? 'bg-blue-50' : 'bg-white'}`}>
              {plan.highlighted && (
                <span className="inline-block px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full mb-4">
                  Mais Popular
                </span>
              )}
              
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">R$ {plan.price.toFixed(2)}</span>
                <span className="text-gray-500 ml-1">/{billingInterval === 'month' ? 'mês' : 'ano'}</span>
              </div>
              
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-sm text-gray-700">Até {plan.contactLimit.toLocaleString()} contatos</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-sm text-gray-700">Até {plan.deviceLimit} dispositivos</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-sm text-gray-700">Até {plan.campaignLimit} campanhas ativas</span>
                </li>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-6 py-4 bg-gray-50">
              {currentPlanId === plan.id ? (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-md font-medium cursor-not-allowed"
                >
                  Plano Atual
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      // Para Trial mantemos seleção direta; para planos pagos, abre checkout
                      const isTrial = String(plan.name).toLowerCase().includes('trial');
                      if (isTrial) {
                        const res = await fetch('/api/plan/select', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: plan.id }),
                        });
                        if (!res.ok) throw new Error('Falha ao atualizar plano');
                        window.location.reload();
                        return;
                      }
                      const res = await fetch('/api/billing/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planId: plan.id }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.url) throw new Error(data.error || 'Falha no checkout');
                      window.location.href = data.url;
                    } catch (e) {
                      console.error(e);
                      alert('Não foi possível iniciar o checkout.');
                    }
                  }}
                  className={`w-full py-2 px-4 rounded-md font-medium ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
                >
                  Selecionar Plano
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}