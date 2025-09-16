'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Settings,
  Palette,
  Search
} from 'lucide-react';
import { whatsappLabelsService, type Label, type LabelAssociation } from '@/lib/whatsapp-labels';
import toast from 'react-hot-toast';

interface WhatsAppLabelsManagerProps {
  instanceKey: string;
  instanceName?: string;
}

const LABEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

export function WhatsAppLabelsManager({ instanceKey, instanceName }: WhatsAppLabelsManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [associations, setAssociations] = useState<LabelAssociation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#FF6B6B' });

  // Carregar etiquetas
  useEffect(() => {
    loadLabels();
  }, [instanceKey]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const result = await whatsappLabelsService.loadLabels(instanceKey);
      
      if (result.success && result.data) {
        setLabels(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar etiquetas:', error);
      toast.error('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const syncLabels = async () => {
    try {
      setLoading(true);
      
      // Sincronizar com WhatsApp
      const syncResult = await whatsappLabelsService.syncLabels(instanceKey);
      if (!syncResult.success) {
        throw new Error(syncResult.message);
      }

      // Obter etiquetas atualizadas
      const labelsResult = await whatsappLabelsService.getLabels(instanceKey);
      if (labelsResult.success && labelsResult.data) {
        const transformedLabels = labelsResult.data.map((label: any) => ({
          id: label.id || label.labelId,
          name: label.name,
          color: label.color || '#FF6B6B',
          description: label.description
        }));
        
        // Salvar no banco local
        await whatsappLabelsService.saveLabels(instanceKey, transformedLabels);
        setLabels(transformedLabels);
        toast.success('Etiquetas sincronizadas com sucesso!');
      }

      // Obter associações atualizadas
      const associationsResult = await whatsappLabelsService.getLabelAssociations(instanceKey);
      if (associationsResult.success && associationsResult.data) {
        const transformedAssociations = associationsResult.data.map((assoc: any) => ({
          chatId: assoc.chatId || assoc.chat_id,
          labelId: assoc.labelId || assoc.label_id
        }));
        
        // Salvar no banco local
        await whatsappLabelsService.saveLabelAssociations(instanceKey, transformedAssociations);
        setAssociations(transformedAssociations);
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar etiquetas:', error);
      toast.error(error.message || 'Erro ao sincronizar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async () => {
    if (!newLabel.name.trim()) {
      toast.error('Nome da etiqueta é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const result = await whatsappLabelsService.createLabel(instanceKey, newLabel.name, newLabel.color);
      
      if (result.success) {
        toast.success('Etiqueta criada com sucesso!');
        setNewLabel({ name: '', color: '#FF6B6B' });
        setShowCreateForm(false);
        await loadLabels(); // Recarregar etiquetas
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar etiqueta:', error);
      toast.error(error.message || 'Erro ao criar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const editLabel = async (label: Label) => {
    try {
      setSaving(true);
      const result = await whatsappLabelsService.editLabel(instanceKey, label.id, label.name, label.color);
      
      if (result.success) {
        toast.success('Etiqueta editada com sucesso!');
        setEditingLabel(null);
        await loadLabels(); // Recarregar etiquetas
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao editar etiqueta:', error);
      toast.error(error.message || 'Erro ao editar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const deleteLabel = async (labelId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta etiqueta?')) {
      return;
    }

    try {
      setSaving(true);
      const result = await whatsappLabelsService.editLabel(instanceKey, labelId, '', '', true);
      
      if (result.success) {
        toast.success('Etiqueta deletada com sucesso!');
        await loadLabels(); // Recarregar etiquetas
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao deletar etiqueta:', error);
      toast.error(error.message || 'Erro ao deletar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando etiquetas...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Sistema de Etiquetas
          </CardTitle>
          <CardDescription>
            Organize seus chats com etiquetas personalizadas
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar etiquetas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Etiqueta
            </Button>
            <Button
              variant="outline"
              onClick={syncLabels}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </div>

          {/* Formulário de criação */}
          {showCreateForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Criar Nova Etiqueta</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="label-name">Nome da Etiqueta</Label>
                    <Input
                      id="label-name"
                      value={newLabel.name}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome da etiqueta"
                      maxLength={25}
                    />
                  </div>
                  <div>
                    <Label>Cor da Etiqueta</Label>
                    <div className="flex gap-2 mt-2">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newLabel.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createLabel}
                      disabled={saving || !newLabel.name.trim()}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Criar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewLabel({ name: '', color: '#FF6B6B' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de etiquetas */}
          <div className="space-y-2">
            {filteredLabels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma etiqueta encontrada' : 'Nenhuma etiqueta criada'}
              </div>
            ) : (
              filteredLabels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{label.name}</h3>
                    {label.description && (
                      <p className="text-sm text-gray-500">{label.description}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingLabel(label)}
                      disabled={saving}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLabel(label.id)}
                      disabled={saving}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal de edição */}
          {editingLabel && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Editar Etiqueta</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-label-name">Nome da Etiqueta</Label>
                    <Input
                      id="edit-label-name"
                      value={editingLabel.name}
                      onChange={(e) => setEditingLabel(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Digite o nome da etiqueta"
                      maxLength={25}
                    />
                  </div>
                  <div>
                    <Label>Cor da Etiqueta</Label>
                    <div className="flex gap-2 mt-2">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            editingLabel.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingLabel(prev => prev ? { ...prev, color } : null)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => editLabel(editingLabel)}
                      disabled={saving || !editingLabel.name.trim()}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Edit className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingLabel(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total de etiquetas:</span>
                <span className="ml-2 font-medium">{labels.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Associações:</span>
                <span className="ml-2 font-medium">{associations.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
