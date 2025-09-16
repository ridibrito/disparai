'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Archive, 
  Pin, 
  Volume2, 
  VolumeX, 
  Ban, 
  CheckCircle, 
  XCircle,
  Trash2,
  Star,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
  Settings
} from 'lucide-react';
import { whatsappChatManagementService, type ChatAction } from '@/lib/whatsapp-chat-management';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  isRead: boolean;
}

interface WhatsAppChatManagerProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppChatManager({ instanceKey, instanceName }: WhatsAppChatManagerProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived' | 'pinned' | 'muted' | 'blocked'>('all');

  // Carregar chats
  useEffect(() => {
    loadChats();
  }, [instanceKey]);

  // Filtrar chats
  useEffect(() => {
    let filtered = chats;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(chat => 
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unreadCount > 0);
        break;
      case 'archived':
        filtered = filtered.filter(chat => chat.isArchived);
        break;
      case 'pinned':
        filtered = filtered.filter(chat => chat.isPinned);
        break;
      case 'muted':
        filtered = filtered.filter(chat => chat.isMuted);
        break;
      case 'blocked':
        filtered = filtered.filter(chat => chat.isBlocked);
        break;
    }

    setFilteredChats(filtered);
  }, [chats, searchTerm, filter]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const result = await whatsappChatManagementService.getChats(instanceKey);
      
      if (result.success && result.data) {
        // Transformar dados da API para o formato local
        const transformedChats = result.data.map((chat: any) => ({
          id: chat.id || chat.chatId,
          name: chat.name || chat.contact?.name || 'Chat sem nome',
          isGroup: chat.isGroup || false,
          unreadCount: chat.unreadCount || 0,
          lastMessage: chat.lastMessage?.body || '',
          lastMessageTime: chat.lastMessage?.timestamp || '',
          isArchived: chat.isArchived || false,
          isPinned: chat.isPinned || false,
          isMuted: chat.isMuted || false,
          isBlocked: chat.isBlocked || false,
          isRead: chat.isRead || true
        }));
        
        setChats(transformedChats);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast.error('Erro ao carregar chats');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chatId: string, selected: boolean) => {
    if (selected) {
      setSelectedChats(prev => [...prev, chatId]);
    } else {
      setSelectedChats(prev => prev.filter(id => id !== chatId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedChats(filteredChats.map(chat => chat.id));
    } else {
      setSelectedChats([]);
    }
  };

  const executeBatchAction = async (action: ChatAction['action'], value?: any) => {
    if (selectedChats.length === 0) {
      toast.error('Selecione pelo menos um chat');
      return;
    }

    try {
      setSaving(true);
      
      const actions: ChatAction[] = selectedChats.map(chatId => ({
        chatId,
        action,
        value
      }));

      const result = await whatsappChatManagementService.executeBatchActions(instanceKey, actions);
      
      if (result.success) {
        toast.success(result.message);
        setSelectedChats([]);
        await loadChats(); // Recarregar chats
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao executar ação em lote:', error);
      toast.error(error.message || 'Erro ao executar ação');
    } finally {
      setSaving(false);
    }
  };

  const executeSingleAction = async (chatId: string, action: ChatAction['action'], value?: any) => {
    try {
      setSaving(true);
      
      let result;
      switch (action) {
        case 'archive':
          result = await whatsappChatManagementService.archiveChat(instanceKey, chatId, true);
          break;
        case 'unarchive':
          result = await whatsappChatManagementService.archiveChat(instanceKey, chatId, false);
          break;
        case 'pin':
          result = await whatsappChatManagementService.pinChat(instanceKey, chatId, true);
          break;
        case 'unpin':
          result = await whatsappChatManagementService.pinChat(instanceKey, chatId, false);
          break;
        case 'mute':
          result = await whatsappChatManagementService.muteChat(instanceKey, chatId, true, value);
          break;
        case 'unmute':
          result = await whatsappChatManagementService.muteChat(instanceKey, chatId, false);
          break;
        case 'block':
          result = await whatsappChatManagementService.blockChat(instanceKey, chatId, true);
          break;
        case 'unblock':
          result = await whatsappChatManagementService.blockChat(instanceKey, chatId, false);
          break;
        case 'read':
          result = await whatsappChatManagementService.readChat(instanceKey, chatId, true);
          break;
        case 'unread':
          result = await whatsappChatManagementService.readChat(instanceKey, chatId, false);
          break;
        case 'delete':
          result = await whatsappChatManagementService.deleteChat(instanceKey, chatId);
          break;
        case 'clear':
          result = await whatsappChatManagementService.clearChat(instanceKey, chatId);
          break;
        default:
          throw new Error('Ação não suportada');
      }
      
      if (result.success) {
        toast.success(result.message);
        await loadChats(); // Recarregar chats
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao executar ação:', error);
      toast.error(error.message || 'Erro ao executar ação');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando chats...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Gestão de Chats
          </CardTitle>
          <CardDescription>
            Gerencie seus chats WhatsApp
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros e busca */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="unread">Não lidos</option>
              <option value="archived">Arquivados</option>
              <option value="pinned">Fixados</option>
              <option value="muted">Silenciados</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>

          {/* Ações em lote */}
          {selectedChats.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedChats.length} chat(s) selecionado(s)
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBatchAction('archive')}
                  disabled={saving}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Arquivar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBatchAction('pin')}
                  disabled={saving}
                >
                  <Pin className="h-4 w-4 mr-1" />
                  Fixar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBatchAction('mute')}
                  disabled={saving}
                >
                  <VolumeX className="h-4 w-4 mr-1" />
                  Silenciar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeBatchAction('read')}
                  disabled={saving}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar como lido
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => executeBatchAction('delete')}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deletar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de chats */}
          <div className="space-y-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum chat encontrado
              </div>
            ) : (
              <>
                {/* Cabeçalho com seleção */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={selectedChats.length === filteredChats.length && filteredChats.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Selecionar todos</span>
                </div>

                {/* Chats */}
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedChats.includes(chat.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={selectedChats.includes(chat.id)}
                      onCheckedChange={(checked) => handleSelectChat(chat.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{chat.name}</h3>
                        {chat.isGroup && (
                          <Badge variant="secondary" className="text-xs">
                            Grupo
                          </Badge>
                        )}
                        {chat.isPinned && (
                          <Pin className="h-4 w-4 text-blue-500" />
                        )}
                        {chat.isMuted && (
                          <VolumeX className="h-4 w-4 text-gray-500" />
                        )}
                        {chat.isBlocked && (
                          <Ban className="h-4 w-4 text-red-500" />
                        )}
                        {chat.isArchived && (
                          <Archive className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage}
                        </p>
                      )}
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {chat.unreadCount} não lidas
                        </Badge>
                      )}
                    </div>

                    {/* Ações individuais */}
                    <div className="flex gap-1">
                      {!chat.isArchived ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'archive')}
                          disabled={saving}
                          title="Arquivar"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'unarchive')}
                          disabled={saving}
                          title="Desarquivar"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}

                      {!chat.isPinned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'pin')}
                          disabled={saving}
                          title="Fixar"
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'unpin')}
                          disabled={saving}
                          title="Desfixar"
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                      )}

                      {!chat.isMuted ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'mute')}
                          disabled={saving}
                          title="Silenciar"
                        >
                          <VolumeX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'unmute')}
                          disabled={saving}
                          title="Desilenciar"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      )}

                      {!chat.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeSingleAction(chat.id, 'read')}
                          disabled={saving}
                          title="Marcar como lido"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => executeSingleAction(chat.id, 'clear')}
                        disabled={saving}
                        title="Limpar chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
