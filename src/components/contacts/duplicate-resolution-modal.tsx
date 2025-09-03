'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Check, X, Phone, Mail, User, AlertTriangle } from 'lucide-react';

type Contact = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  group?: string;
  notes?: string;
  isDuplicate?: boolean;
};

type DuplicateGroup = {
  phone: string;
  contacts: Contact[];
};

type DuplicateResolutionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateGroup[];
  onResolve: (resolvedContacts: Contact[]) => void;
};

export function DuplicateResolutionModal({ 
  isOpen, 
  onClose, 
  duplicates, 
  onResolve 
}: DuplicateResolutionModalProps) {
  const [resolvedContacts, setResolvedContacts] = useState<Contact[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen) return null;

  const handleResolve = async () => {
    if (resolvedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato para cada grupo de duplicados');
      return;
    }

    setIsResolving(true);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onResolve(resolvedContacts);
      toast.success(`${resolvedContacts.length} contatos únicos preparados para importação`);
      onClose();
    } catch (error) {
      toast.error('Erro ao resolver duplicados');
    } finally {
      setIsResolving(false);
    }
  };

  const handleContactSelection = (phone: string, contact: Contact, isSelected: boolean) => {
    if (isSelected) {
      setResolvedContacts(prev => [...prev, contact]);
    } else {
      setResolvedContacts(prev => prev.filter(c => c.phone !== phone || c.name !== contact.name));
    }
  };

  const isContactSelected = (phone: string, contact: Contact) => {
    return resolvedContacts.some(c => c.phone === phone && c.name === contact.name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Resolver Duplicados</h2>
              <p className="text-sm text-gray-600">
                {duplicates.length} grupos de duplicados encontrados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {duplicates.map((group, groupIndex) => (
              <div key={group.phone} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-gray-900">{group.phone}</span>
                  <span className="text-sm text-gray-500">
                    ({group.contacts.length} contatos)
                  </span>
                </div>

                <div className="space-y-3">
                  {group.contacts.map((contact, contactIndex) => (
                    <div
                      key={contactIndex}
                      className={`p-3 border rounded-lg transition-all ${
                        isContactSelected(group.phone, contact)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isContactSelected(group.phone, contact)}
                          onChange={(e) => handleContactSelection(group.phone, contact, e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {contact.name || 'Sem nome'}
                            </span>
                          </div>
                          
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{contact.email}</span>
                            </div>
                          )}
                          
                          {contact.group && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Grupo:</span>
                              <span className="text-sm text-gray-600">{contact.group}</span>
                            </div>
                          )}
                          
                          {contact.notes && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Observações:</span>
                              <span className="text-sm text-gray-600">{contact.notes}</span>
                            </div>
                          )}
                        </div>

                        {isContactSelected(group.phone, contact) && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  💡 Selecione o contato que deseja manter ou marque múltiplos se quiser preservar todos
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {resolvedContacts.length} contatos selecionados
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isResolving}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleResolve}
              disabled={isResolving || resolvedContacts.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isResolving ? 'Resolvendo...' : 'Resolver Duplicados'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
