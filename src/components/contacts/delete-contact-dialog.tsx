'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { showDangerToast } from '@/components/ui/app-toast';
import { createClientComponentClient } from '@/lib/supabase';

type DeleteContactDialogProps = {
  contactId: string;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteContactDialog({
  contactId,
  contactName,
  isOpen,
  onClose,
  onDeleted,
}: DeleteContactDialogProps) {
  const supabase = createClientComponentClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
      
      showDangerToast('Contato excluído com sucesso!');
      onDeleted();
      onClose();
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      toast.error(error.message || 'Erro ao excluir contato. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Excluir Contato</h3>
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir o contato <strong>{contactName}</strong>? 
          Esta ação não pode ser desfeita.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#dc2626' }}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}