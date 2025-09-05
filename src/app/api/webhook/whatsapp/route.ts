import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook recebido do WhatsApp');
    
    const body = await request.json();
    console.log('📦 Dados do webhook:', JSON.stringify(body, null, 2));
    
    // Verificar se é uma mensagem recebida
    if (body.type === 'message' && body.message) {
      const { from, body: messageBody, type: messageType } = body.message;
      
      console.log(`📨 Mensagem recebida de ${from}: ${messageBody} (tipo: ${messageType})`);
      
      // Aqui você pode processar a mensagem
      // Por exemplo: salvar no banco, responder automaticamente, etc.
      
      // Exemplo: Salvar mensagem no banco de dados
      const supabase = createClient();
      
      // Buscar a conexão da instância
      const { data: connection } = await supabase
        .from('api_connections')
        .select('*')
        .eq('type', 'whatsapp_disparai')
        .eq('instance_id', body.instance || 'disparai')
        .single();
      
      if (connection) {
        // Salvar mensagem recebida
        const { error } = await supabase
          .from('messages')
          .insert({
            connection_id: connection.id,
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
    
    // Verificar se é status de conexão
    if (body.type === 'connection' || body.type === 'status') {
      console.log(`🔌 Status da conexão: ${body.status || body.connection}`);
      
      // Atualizar status da conexão no banco
      const supabase = createClient();
      
      const { error } = await supabase
        .from('api_connections')
        .update({ 
          status: body.status === 'connected' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('type', 'whatsapp_disparai')
        .eq('instance_id', body.instance || 'disparai');
      
      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
      } else {
        console.log('✅ Status atualizado no banco de dados');
      }
    }
    
    // Verificar se é status de entrega
    if (body.type === 'delivery' || body.type === 'read') {
      console.log(`📬 Status de entrega: ${body.status} para ${body.to}`);
      
      // Atualizar status da mensagem no banco
      const supabase = createClient();
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('to_number', body.to)
        .eq('message_id', body.messageId)
        .eq('direction', 'outbound');
      
      if (error) {
        console.error('❌ Erro ao atualizar status de entrega:', error);
      } else {
        console.log('✅ Status de entrega atualizado');
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
