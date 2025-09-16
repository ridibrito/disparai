'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WhatsAppConnectionManager } from '@/components/whatsapp/whatsapp-connection-manager';
import { WhatsAppProfileManager } from '@/components/whatsapp/whatsapp-profile-manager';
import { WhatsAppPrivacyManager } from '@/components/whatsapp/whatsapp-privacy-manager';
import { WhatsAppChatManager } from '@/components/whatsapp/whatsapp-chat-manager';
import { WhatsAppLabelsManager } from '@/components/whatsapp/whatsapp-labels-manager';
import { WhatsAppMonitoring } from '@/components/whatsapp/whatsapp-monitoring';
import { WhatsAppInteractiveBuilder } from '@/components/whatsapp/whatsapp-interactive-builder';
import { WhatsAppAutomationManager } from '@/components/whatsapp/whatsapp-automation-manager';
import { WhatsAppAnalyticsDashboard } from '@/components/whatsapp/whatsapp-analytics-dashboard';
import { WhatsAppConnectionsSimple } from '@/components/whatsapp/whatsapp-connections-simple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings, 
  Shield, 
  User, 
  MessageSquare, 
  Tag, 
  Activity, 
  Bot, 
  Zap, 
  BarChart3, 
  Plus,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Home,
  Monitor,
  Users,
  FileText,
  Workflow
} from 'lucide-react';

// Componente do Sidebar
function CentralWhatsAppSidebar({ 
  activeSection, 
  onSectionChange, 
  activeInstances 
}: { 
  activeSection: string; 
  onSectionChange: (section: string) => void;
  activeInstances: any[];
}) {
  const sections = [
    {
      id: 'overview',
      title: 'Visão Geral',
      icon: Home,
      description: 'Dashboard principal'
    },
    {
      id: 'monitoring',
      title: 'Monitoramento',
      icon: Monitor,
      description: 'Status e QR Code'
    },
    {
      id: 'profile',
      title: 'Perfil',
      icon: User,
      description: 'Nome e foto'
    },
    {
      id: 'privacy',
      title: 'Privacidade',
      icon: Shield,
      description: 'Configurações de privacidade'
    },
    {
      id: 'chats',
      title: 'Chats',
      icon: MessageSquare,
      description: 'Gestão de conversas'
    },
    {
      id: 'labels',
      title: 'Etiquetas',
      icon: Tag,
      description: 'Sistema de etiquetas'
    },
    {
      id: 'interactive',
      title: 'Mensagens Interativas',
      icon: Bot,
      description: 'Botões e listas'
    },
    {
      id: 'automation',
      title: 'Automação',
      icon: Workflow,
      description: 'Workflows e triggers'
    },
    {
      id: 'analytics',
      title: 'Análise',
      icon: BarChart3,
      description: 'Relatórios e métricas'
    },
  ];

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header do Sidebar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Central WhatsApp</h2>
            <p className="text-sm text-gray-500">Gestão completa</p>
          </div>
        </div>
        
        {/* Status das Instâncias */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Instâncias Ativas</span>
            <Badge className="bg-green-100 text-green-800">
              {activeInstances.filter(inst => inst.status === 'connected').length}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <Badge variant="outline">
              {activeInstances.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{section.title}</div>
                  <div className="text-xs text-gray-500 truncate">{section.description}</div>
                </div>
                <ChevronRight className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer do Sidebar */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Link href="/configuracoes">
          <Button variant="outline" size="sm" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Configurações
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Componente do Conteúdo Principal
function CentralWhatsAppContent({ 
  activeSection, 
  activeInstances, 
  organizationInfo 
}: { 
  activeSection: string; 
  activeInstances: any[];
  organizationInfo: any;
}) {
  // Removido o return antecipado para permitir renderização da seção de conexões

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Visão Geral</h1>
              <p className="text-gray-600">Dashboard principal das suas instâncias WhatsApp</p>
            </div>

            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conectadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {activeInstances.filter(inst => inst.status === 'connected' || inst.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <WifiOff className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Desconectadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {activeInstances.filter(inst => inst.status !== 'connected' && inst.status !== 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {activeInstances.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gestão de Conexões */}
            <WhatsAppConnectionsSimple organizationInfo={organizationInfo} />
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Monitoramento</h1>
              <p className="text-gray-600">Status em tempo real das suas instâncias</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                  <CardDescription>
                    {instance.type === 'whatsapp_disparai' ? 'Disparai API (Unofficial)' : 'WhatsApp Cloud API'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppMonitoring 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil WhatsApp</h1>
              <p className="text-gray-600">Gerencie nome, status e foto de perfil</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppProfileManager 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacidade</h1>
              <p className="text-gray-600">Configurações de privacidade do WhatsApp</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppPrivacyManager 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'chats':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Chats</h1>
              <p className="text-gray-600">Arquivar, fixar, silenciar e gerenciar conversas</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppChatManager 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'labels':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Etiquetas</h1>
              <p className="text-gray-600">Organize conversas com etiquetas personalizadas</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppLabelsManager 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'interactive':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Mensagens Interativas</h1>
              <p className="text-gray-600">Crie botões, listas e mensagens interativas</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppInteractiveBuilder 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'automation':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Automação</h1>
              <p className="text-gray-600">Configure workflows e automações</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppAutomationManager 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Análise e Relatórios</h1>
              <p className="text-gray-600">Métricas, relatórios e insights</p>
            </div>
            
            {activeInstances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {instance.name || `Instância ${(instance.instance_id || instance.phone_number || 'Desconhecida').slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }>
                    <WhatsAppAnalyticsDashboard 
                      instanceKey={instance.instance_id || instance.phone_number}
                      instanceName={instance.name}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            ))}
          </div>
        );


      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Seção não encontrada</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {renderContent()}
    </div>
  );
}

// Componente Principal do Cliente
export function CentralWhatsAppClient({ 
  activeInstances, 
  organizationInfo 
}: { 
  activeInstances: any[];
  organizationInfo: any;
}) {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar Fixo - posicionado após o sidebar principal */}
      <div 
        className="fixed top-16 w-80 h-[calc(100vh-4rem)] z-20"
        style={{ left: 'var(--sidebar-width, 16rem)' }}
      >
        <CentralWhatsAppSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          activeInstances={activeInstances}
        />
      </div>
      
      {/* Conteúdo Principal com Margem */}
      <div 
        className="flex-1"
        style={{ marginLeft: 'calc(var(--sidebar-width, 16rem) + 20rem)' }}
      >
        <CentralWhatsAppContent 
          activeSection={activeSection}
          activeInstances={activeInstances}
          organizationInfo={organizationInfo}
        />
      </div>
    </div>
  );
}
