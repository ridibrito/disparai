// Script para atualizar webhook URL no banco de dados Supabase
// Execute: node examples/update-supabase-webhook-url.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_NGROK_URL = 'https://b41819143523.ngrok-free.app';

async function updateSupabaseWebhookUrls() {
  try {
    console.log('🔧 Atualizando webhook URLs no banco de dados Supabase...\n');
    console.log('🌐 Novo URL ngrok:', NEW_NGROK_URL);
    
    // 1. Buscar todas as instâncias do WhatsApp
    console.log('1️⃣ Buscando instâncias do WhatsApp...');
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar instâncias:', fetchError);
      return;
    }
    
    console.log(`✅ Encontradas ${instances.length} instâncias`);
    
    if (instances.length === 0) {
      console.log('⚠️ Nenhuma instância encontrada no banco de dados');
      return;
    }
    
    // 2. Atualizar webhook URL para cada instância
    console.log('\n2️⃣ Atualizando webhook URLs...');
    const results = [];
    
    for (const instance of instances) {
      console.log(`   🔄 Atualizando instância: ${instance.instance_key}`);
      
      const newWebhookUrl = `${NEW_NGROK_URL}/api/mega/webhook`;
      
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          webhook_url: newWebhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id)
        .select();
      
      if (updateError) {
        console.log(`   ❌ Erro ao atualizar ${instance.instance_key}:`, updateError.message);
        results.push({
          instance_key: instance.instance_key,
          status: 'error',
          error: updateError.message
        });
      } else {
        console.log(`   ✅ Atualizada: ${instance.instance_key}`);
        console.log(`      Antes: ${instance.webhook_url}`);
        console.log(`      Depois: ${newWebhookUrl}`);
        results.push({
          instance_key: instance.instance_key,
          status: 'updated',
          old_webhook: instance.webhook_url,
          new_webhook: newWebhookUrl
        });
      }
    }
    
    // 3. Resumo dos resultados
    console.log('\n📊 Resumo da atualização:');
    const successful = results.filter(r => r.status === 'updated').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`   ✅ Sucessos: ${successful}`);
    console.log(`   ❌ Falhas: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Instâncias com erro:');
      results.filter(r => r.status === 'error').forEach(r => {
        console.log(`   - ${r.instance_key}: ${r.error}`);
      });
    }
    
    console.log('\n🎉 Atualização do banco de dados concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Execute o script de configuração da Mega API');
    console.log('   2. Teste o webhook enviando uma mensagem');
    console.log('   3. Verifique se as mensagens aparecem na aplicação');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
updateSupabaseWebhookUrls();
