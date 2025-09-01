'use client';

import { Progress } from '@/components/ui/progress';

type PlanLimitProgressProps = {
  current: number;
  limit: number;
  label: string;
};

export function PlanLimitProgress({ current, limit, label }: PlanLimitProgressProps) {
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-700'}`}>
          {current} / {limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-amber-100' : 'bg-gray-100'}`}
        indicatorClassName={`${isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-amber-600' : 'bg-blue-600'}`}
      />
    </div>
  );
}