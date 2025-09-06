import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook recebido do WhatsApp');
    
    const body = await request.json();
    console.log('📦 Dados do webhook:', JSON.stringify(body, null, 2));
    
    const supabase = await createServerClient();
    
    // Verificar se é uma notificação de conexão
    if (body.type === 'connection' || body.type === 'status') {
      const instanceKey = body.instance || body.instance_key;
      const status = body.status || body.connection;
      
      console.log(`🔌 Status da conexão: ${status} para instância: ${instanceKey}`);
      
      if (instanceKey) {
        // Mapear status do MegaAPI para nosso status
        let mappedStatus = 'pendente';
        if (status === 'connected') {
          mappedStatus = 'ativo';
        } else if (status === 'disconnected') {
          mappedStatus = 'desconectado';
        }
        
        // Atualizar status da instância no banco
        const { error } = await supabase
          .from('whatsapp_instances')
          .update({ 
            status: mappedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('instance_key', instanceKey);
        
        if (error) {
          console.error('❌ Erro ao atualizar status da instância:', error);
        } else {
          console.log(`✅ Status da instância atualizado para: ${mappedStatus}`);
          
          // Se conectou, criar conexão na tabela api_connections se não existir
          if (mappedStatus === 'ativo') {
            const { data: existingConnection } = await supabase
              .from('api_connections')
              .select('*')
              .eq('instance_id', instanceKey)
              .single();
            
            if (!existingConnection) {
              // Buscar organization_id da instância
              const { data: instance } = await supabase
                .from('whatsapp_instances')
                .select('organization_id')
                .eq('instance_key', instanceKey)
                .single();
              
              if (instance) {
                // Buscar user_id da organização
                const { data: user } = await supabase
                  .from('users')
                  .select('id')
                  .eq('organization_id', instance.organization_id)
                  .single();
                
                if (user) {
                  const { error: connectionError } = await supabase
                    .from('api_connections')
                    .insert({
                      user_id: user.id,
                      organization_id: instance.organization_id,
                      name: `WhatsApp Disparai - ${instanceKey}`,
                      type: 'whatsapp_disparai',
                      instance_id: instanceKey,
                      api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
                      status: 'active',
                      is_active: true
                    });
                  
                  if (connectionError) {
                    console.error('❌ Erro ao criar conexão:', connectionError);
                  } else {
                    console.log('✅ Conexão criada automaticamente');
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Verificar se é uma mensagem recebida
    if (body.type === 'message' && body.message) {
      const { from, body: messageBody, type: messageType } = body.message;
      const instanceKey = body.instance || body.instance_key;
      
      console.log(`📨 Mensagem recebida de ${from}: ${messageBody} (tipo: ${messageType})`);
      
      if (instanceKey) {
        // Buscar a instância no banco
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_key', instanceKey)
          .single();
        
        if (instance) {
          // Salvar mensagem recebida
          const { error } = await supabase
            .from('messages')
            .insert({
              connection_id: instance.id,
              from_number: from,
              message_body: messageBody,
              message_type: messageType,
              direction: 'inbound',
              status: 'received',
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('❌ Erro ao salvar mensagem:', error);
          } else {
            console.log('✅ Mensagem salva no banco de dados');
          }
        }
      }
    }
    
    // Verificar se é status de entrega
    if (body.type === 'delivery' || body.type === 'read') {
      const instanceKey = body.instance || body.instance_key;
      const status = body.status;
      const to = body.to;
      const messageId = body.messageId;
      
      console.log(`📬 Status de entrega: ${status} para ${to}`);
      
      if (instanceKey && messageId) {
        // Atualizar status da mensagem no banco
        const { error } = await supabase
          .from('messages')
          .update({ 
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('to_number', to)
          .eq('message_id', messageId)
          .eq('direction', 'outbound');
        
        if (error) {
          console.error('❌ Erro ao atualizar status de entrega:', error);
        } else {
          console.log('✅ Status de entrega atualizado');
        }
      }
    }
    
    // Responder com sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Endpoint para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint funcionando!',
    timestamp: new Date().toISOString()
  });
}
