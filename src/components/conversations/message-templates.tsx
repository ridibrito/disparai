'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  created_at: string;
}

interface MessageTemplatesProps {
  onSelectTemplate: (template: MessageTemplate) => void;
  onClose: () => void;
}

export function MessageTemplates({ onSelectTemplate, onClose }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Boas-vindas',
      content: 'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?',
      category: 'Atendimento',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Agradecimento',
      content: 'Obrigado pelo seu contato! Foi um prazer atendê-lo(a).',
      category: 'Atendimento',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Informações de produto',
      content: 'Gostaria de saber mais informações sobre nossos produtos? Posso enviar nosso catálogo completo!',
      category: 'Vendas',
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Agendamento',
      content: 'Gostaria de agendar uma reunião? Qual horário seria melhor para você?',
      category: 'Agendamento',
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Suporte técnico',
      content: 'Entendo que você está enfrentando um problema técnico. Vou ajudá-lo(a) a resolver isso.',
      category: 'Suporte',
      created_at: new Date().toISOString()
    }
  ]);

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'Atendimento'
  });

  const categories = ['Atendimento', 'Vendas', 'Suporte', 'Agendamento', 'Outros'];

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content,
      category: newTemplate.category,
      created_at: new Date().toISOString()
    };

    setTemplates(prev => [template, ...prev]);
    setNewTemplate({ name: '', content: '', category: 'Atendimento' });
    setShowNewTemplate(false);
    toast.success('Template criado com sucesso!');
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template excluído');
    }
  };

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copiado para a área de transferência');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Templates de Mensagem</span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNewTemplate(true)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showNewTemplate ? (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Criar Novo Template</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Boas-vindas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Digite o conteúdo do template..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Criar Template
                </button>
                <button
                  onClick={() => setShowNewTemplate(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(category => {
                const categoryTemplates = templates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-md font-semibold text-gray-900 mb-2">{category}</h3>
                    <div className="space-y-2">
                      {categoryTemplates.map(template => (
                        <div
                          key={template.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-3">
                              <button
                                onClick={() => onSelectTemplate(template)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                title="Usar template"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyTemplate(template.content)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Copiar"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
