'use client';

import { MessageSquare, Clock } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  shortcut: string;
}

interface TemplateSuggestionsProps {
  suggestions: Template[];
  selectedIndex: number;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplateSuggestions({ suggestions, selectedIndex, onSelect, onClose }: TemplateSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg w-[calc(100vw-20rem-8rem)] max-h-64 overflow-y-auto z-50">
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">
          {suggestions.length === 1 ? 'Template disponível:' : 'Templates disponíveis:'}
        </div>
        {suggestions.map((template, index) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`w-full text-left p-2 rounded transition-colors ${
              index === selectedIndex
                ? 'bg-green-50 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900">{template.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                    /{template.shortcut}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-1">{template.content}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-400">{template.category}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="border-t border-gray-200 p-2">
        <div className="text-xs text-gray-500 text-center">
          Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
        </div>
      </div>
    </div>
  );
}
