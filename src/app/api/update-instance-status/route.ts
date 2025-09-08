import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { instanceKey, status } = await req.json();
    
    console.log(`🔄 Atualizando status da instância ${instanceKey} para ${status}...`);

    if (!instanceKey || !status) {
      return NextResponse.json({
        ok: false,
        error: 'instanceKey e status são obrigatórios'
      }, { status: 400 });
    }

    // Determinar qual tabela atualizar baseado no status
    let updatedInstance = null;
    let updateError = null;

    if (status === 'active') {
      // Status 'active' é para api_connections (conectado via QR Code)
      // Primeiro atualizar api_connections
      const { data: connectionData, error: connectionError } = await supabaseAdmin
        .from('api_connections')
        .update({ 
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceKey)
        .select()
        .single();
      
      // Depois atualizar whatsapp_instances para 'ativo'
      const { data: instanceData, error: instanceError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('instance_key', instanceKey)
        .select()
        .single();
      
      updatedInstance = connectionData;
      updateError = connectionError || instanceError;
      
      console.log('✅ Atualizado api_connections:', connectionData);
      console.log('✅ Atualizado whatsapp_instances:', instanceData);
    } else {
      // Outros status são para whatsapp_instances
      const { data, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('instance_key', instanceKey)
        .select()
        .single();
      
      updatedInstance = data;
      updateError = error;
    }

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError);
      return NextResponse.json({
        ok: false,
        error: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    console.log('✅ Status atualizado:', updatedInstance);

    // Se o status for 'ativo', criar conexão na api_connections se não existir
    if (status === 'ativo') {
      console.log('🔗 Verificando se precisa criar conexão na api_connections...');
      
      // Verificar se já existe na api_connections
      const { data: existingConnection } = await supabaseAdmin
        .from('api_connections')
        .select('*')
        .eq('instance_id', instanceKey)
        .single();

      if (existingConnection) {
        console.log('✅ Conexão já existe na api_connections');
      } else {
        console.log('🆕 Criando nova conexão na api_connections...');
        
        // Buscar dados da instância
        const instance = updatedInstance;
        
        // Buscar user_id da organização
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('organization_id', instance.organization_id)
          .single();

        if (user) {
          const connectionData = {
            user_id: user.id,
            organization_id: instance.organization_id,
            name: `WhatsApp Disparai - ${instanceKey}`,
            type: 'whatsapp_disparai',
            instance_id: instanceKey,
            api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            api_secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
            status: 'active',
            is_active: true,
            provider: 'disparai'
          };

          const { data: newConnection, error: connectionError } = await supabaseAdmin
            .from('api_connections')
            .insert(connectionData as any)
            .select()
            .single();

          if (connectionError) {
            console.error('❌ Erro ao criar conexão:', connectionError);
          } else {
            console.log('✅ Conexão criada na api_connections:', newConnection);
          }
        } else {
          console.error('❌ Usuário não encontrado para organização:', instance.organization_id);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Status atualizado com sucesso',
      instance: updatedInstance
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
