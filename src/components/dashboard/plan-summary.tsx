'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import Link from 'next/link';

type PlanSummaryProps = {
  userId: string;
};

type PlanDetails = {
  name: string;
  contactLimit: number;
  messageLimit: number;
  deviceLimit: number;
  currentContacts: number;
  currentMessages: number;
  currentDevices: number;
};

export function PlanSummary({ userId }: PlanSummaryProps) {
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadPlanDetails() {
      try {
        setLoading(true);
        
        // Buscar detalhes do plano do usuário
        const { data: userPlan, error: userError } = await supabase
          .from('user_plans' as any)
          .select('*, plans(*)')
          .eq('user_id', userId as any)
          .single();
        
        if (userError) {
          console.warn('Aviso: falha ao buscar plano do usuário:', userError.message);
          return;
        }

        if (!userPlan || !(userPlan as any).plans) {
          console.warn('Aviso: usuário sem plano vinculado. Exibindo fallback.');
          return;
        }
        
        // Contar contatos
        const { count: contactCount } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId as any);
        
        // Contar mensagens do mês atual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        const { count: messageCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId as any)
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth);
        
        // Contar dispositivos
        const { count: deviceCount } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId as any);
        
        setPlanDetails({
          name: (userPlan as any).plans.name,
          contactLimit: (userPlan as any).plans.contact_limit,
          messageLimit: (userPlan as any).plans.message_limit,
          deviceLimit: (userPlan as any).plans.features?.dispositivos || 1,
          currentContacts: contactCount || 0,
          currentMessages: messageCount || 0,
          currentDevices: deviceCount || 0
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes do plano:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      loadPlanDetails();
    }
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plano não encontrado</h3>
        <p className="text-gray-600 mb-4">Não foi possível carregar os detalhes do seu plano.</p>
        <Link href="/plans">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Escolher um plano
          </button>
        </Link>
      </div>
    );
  }

  const getProgressPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Plano {planDetails.name}</h3>
      <p className="text-gray-600 mb-4">Resumo de utilização do seu plano atual</p>
      
      <div className="space-y-4">
        {/* Contatos */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Contatos</span>
            <span className="text-gray-900">{planDetails.currentContacts} / {planDetails.contactLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(getProgressPercentage(planDetails.currentContacts, planDetails.contactLimit))}`}
              style={{ width: `${getProgressPercentage(planDetails.currentContacts, planDetails.contactLimit)}%` }}
            ></div>
          </div>
        </div>

        {/* Mensagens */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Mensagens (este mês)</span>
            <span className="text-gray-900">{planDetails.currentMessages} / {planDetails.messageLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(getProgressPercentage(planDetails.currentMessages, planDetails.messageLimit))}`}
              style={{ width: `${getProgressPercentage(planDetails.currentMessages, planDetails.messageLimit)}%` }}
            ></div>
          </div>
        </div>

        {/* Dispositivos */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Dispositivos</span>
            <span className="text-gray-900">{planDetails.currentDevices} / {planDetails.deviceLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(getProgressPercentage(planDetails.currentDevices, planDetails.deviceLimit))}`}
              style={{ width: `${getProgressPercentage(planDetails.currentDevices, planDetails.deviceLimit)}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link href="/plans">
          <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Gerenciar plano
          </button>
        </Link>
      </div>
    </div>
  );
}