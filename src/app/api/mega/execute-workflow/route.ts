// API para executar workflow de automação
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, workflowId, context } = await request.json();

    if (!instanceKey || !workflowId) {
      return NextResponse.json(
        { error: 'instanceKey e workflowId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      return NextResponse.json(
        { error: 'Configurações da Mega API não encontradas' },
        { status: 500 }
      );
    }

    console.log('▶️ Executando workflow:', { instanceKey, workflowId, context });

    // Buscar workflow no banco
    const supabase = await createServerClient();
    const { data: workflow, error: workflowError } = await supabase
      .from('whatsapp_automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow não encontrado' },
        { status: 404 }
      );
    }

    if (!workflow.enabled) {
      return NextResponse.json(
        { error: 'Workflow está desativado' },
        { status: 400 }
      );
    }

    // Executar ações do workflow
    const results = [];
    for (const action of workflow.actions) {
      try {
        let result;
        
        switch (action.type) {
          case 'send_message':
            result = await fetch(`${MEGA_HOST}/rest/instance/sendText/${instanceKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': MEGA_TOKEN,
              },
              body: JSON.stringify({
                to: action.config.to,
                text: action.config.text
              }),
            });
            break;

          case 'forward_message':
            result = await fetch(`${MEGA_HOST}/rest/instance/forwardMessage/${instanceKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': MEGA_TOKEN,
              },
              body: JSON.stringify({
                to: action.config.to,
                messageId: action.config.messageId
              }),
            });
            break;

          case 'edit_message':
            result = await fetch(`${MEGA_HOST}/rest/instance/editMessage/${instanceKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': MEGA_TOKEN,
              },
              body: JSON.stringify({
                messageId: action.config.messageId,
                text: action.config.text
              }),
            });
            break;

          case 'react_message':
            result = await fetch(`${MEGA_HOST}/rest/instance/reactMessage/${instanceKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': MEGA_TOKEN,
              },
              body: JSON.stringify({
                messageId: action.config.messageId,
                emoji: action.config.emoji
              }),
            });
            break;

          case 'delay':
            await new Promise(resolve => setTimeout(resolve, action.config.delayMs || 1000));
            result = { ok: true, json: () => Promise.resolve({ success: true }) };
            break;

          case 'add_label':
          case 'remove_label':
            // Implementar lógica de etiquetas
            result = { ok: true, json: () => Promise.resolve({ success: true }) };
            break;

          default:
            throw new Error(`Tipo de ação não suportado: ${action.type}`);
        }

        const actionResult = await result.json();
        results.push({
          action: action.type,
          success: result.ok,
          result: actionResult
        });

        if (!result.ok) {
          console.error(`❌ Erro na ação ${action.type}:`, actionResult);
        }
      } catch (error) {
        console.error(`❌ Erro ao executar ação ${action.type}:`, error);
        results.push({
          action: action.type,
          success: false,
          error: error.message
        });
      }
    }

    // Salvar log de execução
    await supabase
      .from('whatsapp_automation_logs')
      .insert({
        workflow_id: workflowId,
        instance_key: instanceKey,
        context: context,
        results: results,
        executed_at: new Date().toISOString()
      });

    console.log('✅ Workflow executado');
    return NextResponse.json({
      success: true,
      message: 'Workflow executado com sucesso',
      data: {
        workflow: workflow.name,
        results: results
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao executar workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
