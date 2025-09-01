'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

type PlanFeature = {
  name: string;
  included: boolean;
};

type PlanSummaryProps = {
  planName: string;
  messageLimit: number;
  messageUsage: number;
  contactLimit: number;
  contactUsage: number;
  features: PlanFeature[];
};

export function PlanSummary({
  planName,
  messageLimit,
  messageUsage,
  contactLimit,
  contactUsage,
  features
}: PlanSummaryProps) {
  const messagePercentage = Math.min(Math.round((messageUsage / messageLimit) * 100), 100);
  const contactPercentage = Math.min(Math.round((contactUsage / contactLimit) * 100), 100);
  
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>Plano {planName}</span>
          <Link 
            href="/dashboard/plans" 
            className="text-sm text-blue-600 hover:underline"
          >
            Alterar plano
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Mensagens</span>
              <span className="text-sm text-gray-500">
                {messageUsage.toLocaleString()} / {messageLimit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={messagePercentage} 
              indicatorClassName={getProgressColor(messagePercentage)}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Contatos</span>
              <span className="text-sm text-gray-500">
                {contactUsage.toLocaleString()} / {contactLimit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={contactPercentage} 
              indicatorClassName={getProgressColor(contactPercentage)}
            />
          </div>
          
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">Recursos incluídos:</h4>
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  {feature.included ? (
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  )}
                  {feature.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}