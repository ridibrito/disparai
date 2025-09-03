'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDuplicateDetection, type Contact, type DuplicateGroup } from '@/hooks/use-duplicate-detection';

type DuplicateAlertProps = {
  contacts: Contact[];
  onResolveDuplicates?: (resolvedContacts: Contact[]) => void;
  showToast?: boolean;
  compact?: boolean;
};

export function DuplicateAlert({ 
  contacts, 
  onResolveDuplicates, 
  showToast = true, 
  compact = false 
}: DuplicateAlertProps) {
  const { duplicates, hasDuplicates, duplicateStats } = useDuplicateDetection(contacts);
  const [hasShownToast, setHasShownToast] = useState(false);

  // Mostrar toast amarelo quando duplicados são detectados (apenas uma vez)
  useEffect(() => {
    if (showToast && hasDuplicates && duplicateStats && !hasShownToast) {
      setHasShownToast(true);
      
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-yellow-800 mb-1">
                Duplicados detectados!
              </div>
              <div className="text-sm text-yellow-700 mb-2">
                {duplicateStats.uniquePhones} telefones com múltiplos contatos 
                ({duplicateStats.totalDuplicates} contatos duplicados)
              </div>
              {onResolveDuplicates && (
                <Button
                  size="sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    onResolveDuplicates(contacts);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                >
                  Resolver Duplicados
                </Button>
              )}
            </div>
          </div>
        ),
        {
          duration: 10000,
          icon: null,
          style: {
            background: '#fefce8',
            border: '1px solid #fbbf24',
            color: '#92400e'
          }
        }
      );
    }
    
    // Resetar o flag quando não há mais duplicados
    if (!hasDuplicates) {
      setHasShownToast(false);
    }
  }, [hasDuplicates, duplicateStats, showToast, onResolveDuplicates, contacts, hasShownToast]);

  if (!hasDuplicates) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>{duplicateStats?.uniquePhones} duplicados</span>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-yellow-800">
              Duplicados detectados
            </h4>
            <div className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-md text-xs">
              <Phone className="h-3 w-3" />
              {duplicateStats?.uniquePhones} telefones
            </div>
          </div>
          
          <div className="text-sm text-yellow-700 mb-3">
            <p className="mb-1">
              Encontramos {duplicateStats?.totalDuplicates} contatos duplicados 
              ({duplicateStats?.duplicatePercentage}% da sua base).
            </p>
            <p>
              Telefones duplicados podem causar problemas no envio de mensagens e 
              confusão na gestão de contatos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {duplicates.slice(0, 3).map((group) => (
              <div key={group.phone} className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                <Users className="h-3 w-3" />
                {group.phone}: {group.contacts.length} contatos
              </div>
            ))}
            {duplicates.length > 3 && (
              <span className="text-xs text-yellow-600">
                +{duplicates.length - 3} mais...
              </span>
            )}
          </div>

          {onResolveDuplicates && (
            <div className="mt-3">
              <Button
                onClick={() => onResolveDuplicates(contacts)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Resolver Duplicados
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
