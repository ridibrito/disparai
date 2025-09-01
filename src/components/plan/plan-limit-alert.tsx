'use client';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

type PlanLimitAlertProps = {
  title: string;
  description: string;
  showUpgradeLink?: boolean;
};

export function PlanLimitAlert({ 
  title, 
  description, 
  showUpgradeLink = true 
}: PlanLimitAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {description}
        {showUpgradeLink && (
          <div className="mt-2">
            <Link 
              href="/dashboard/plans" 
              className="text-blue-600 hover:underline font-medium"
            >
              Atualizar meu plano
            </Link>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}