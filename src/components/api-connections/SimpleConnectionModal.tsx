'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SimpleWhatsAppConnection from './SimpleWhatsAppConnection';

interface SimpleConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: any) => void;
  userId: string;
  userName: string;
}

export default function SimpleConnectionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  userId, 
  userName 
}: SimpleConnectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações sobre a conexão */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                WhatsApp Business
              </CardTitle>
              <CardDescription className="text-green-700">
                Conecte seu WhatsApp para enviar mensagens em massa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Conexão Automática
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-900">O que você pode fazer:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Enviar mensagens em massa</li>
                    <li>• Enviar mídia (imagens, vídeos, documentos)</li>
                    <li>• Gerenciar contatos</li>
                    <li>• Acompanhar entregas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Componente de conexão simplificado */}
          <SimpleWhatsAppConnection
            userId={userId}
            userName={userName}
            onConnected={() => {
              toast.success('WhatsApp conectado com sucesso!');
              onSave({ type: 'whatsapp_disparai', status: 'connected' });
              onClose();
            }}
            onError={(error) => {
              toast.error('Erro: ' + error);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
