import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { WhatsAppConnectionManager } from '@/components/whatsapp/whatsapp-connection-manager';
import { WhatsAppProfileManager } from '@/components/whatsapp/whatsapp-profile-manager';
import { WhatsAppPrivacyManager } from '@/components/whatsapp/whatsapp-privacy-manager';
import { WhatsAppChatManager } from '@/components/whatsapp/whatsapp-chat-manager';
import { WhatsAppLabelsManager } from '@/components/whatsapp/whatsapp-labels-manager';
import { WhatsAppMonitoring } from '@/components/whatsapp/whatsapp-monitoring';
import { WhatsAppInteractiveBuilder } from '@/components/whatsapp/whatsapp-interactive-builder';
import { WhatsAppAutomationManager } from '@/components/whatsapp/whatsapp-automation-manager';
import { WhatsAppAnalyticsDashboard } from '@/components/whatsapp/whatsapp-analytics-dashboard';
import { WhatsAppSpecificFeatures } from '@/components/whatsapp/whatsapp-specific-features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Shield, User, MessageSquare, Tag, ArrowLeft, Activity, Bot, Zap, BarChart3, Smartphone } from 'lucide-react';

export default async function WhatsAppGestaoPage() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Buscar instâncias ativas do usuário
  const { data: instances, error: instancesError } = await supabase
    .from('api_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('type', ['whatsapp_disparai', 'whatsapp_cloud'])
    .order('created_at', { ascending: false });

  if (instancesError) {
    console.error('Erro ao buscar instâncias:', instancesError);
  }

  const activeInstances = instances || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/configuracoes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestão WhatsApp</h1>
        </div>
      </div>

      {activeInstances.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instância ativa
              </h3>
              <p className="text-gray-500">
                Conecte uma instância WhatsApp para gerenciar perfil e privacidade.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeInstances.map((instance) => (
            <div key={instance.id} className="space-y-4">
              {/* Connection Manager - Always visible */}
              <WhatsAppConnectionManager
                instanceKey={instance.instance_id || instance.phone_number || ''}
                instanceName={instance.name}
                instanceType={instance.type as 'whatsapp_disparai' | 'whatsapp_cloud'}
                isActive={instance.is_active}
              />
              
              {/* Management Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Gestão Avançada
                  </CardTitle>
                  <CardDescription>
                    Gerencie perfil, privacidade e configurações avançadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <Tabs defaultValue="monitoring" className="w-full">
                  <TabsList className="grid w-full grid-cols-9">
                    <TabsTrigger value="monitoring" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Monitoramento
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Privacidade
                    </TabsTrigger>
                    <TabsTrigger value="chats" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chats
                    </TabsTrigger>
                    <TabsTrigger value="labels" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Etiquetas
                    </TabsTrigger>
                    <TabsTrigger value="interactive" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Interativas
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automação
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Análise
                    </TabsTrigger>
                    <TabsTrigger value="specific" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Específicas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="monitoring" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppMonitoring 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="profile" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppProfileManager 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="privacy" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppPrivacyManager 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="chats" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppChatManager 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="labels" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppLabelsManager 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="interactive" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppInteractiveBuilder 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="automation" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppAutomationManager 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppAnalyticsDashboard 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="specific" className="mt-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <WhatsAppSpecificFeatures 
                        instanceKey={instance.instance_id || instance.phone_number}
                        instanceName={instance.name}
                      />
                    </Suspense>
                  </TabsContent>
                </Tabs>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
