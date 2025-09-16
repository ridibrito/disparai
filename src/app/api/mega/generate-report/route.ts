// API para gerar relatórios de análise
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { instanceKey, config } = await request.json();

    if (!instanceKey || !config) {
      return NextResponse.json(
        { error: 'instanceKey e config são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('📄 Gerando relatório:', { instanceKey, config });

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar dados para o relatório
    const [messagesResult, chatsResult, contactsResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey),
      supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey),
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
    ]);

    if (messagesResult.error) {
      throw new Error(messagesResult.error.message);
    }

    if (chatsResult.error) {
      throw new Error(chatsResult.error.message);
    }

    if (contactsResult.error) {
      throw new Error(contactsResult.error.message);
    }

    const messages = messagesResult.data || [];
    const chats = chatsResult.data || [];
    const contacts = contactsResult.data || [];

    // Calcular métricas
    const metrics = {
      messages: {
        total: messages.length,
        sent: messages.filter(m => m.status === 'sent').length,
        received: messages.filter(m => m.status === 'received').length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        read: messages.filter(m => m.status === 'read').length,
        failed: messages.filter(m => m.status === 'failed').length
      },
      chats: {
        total: chats.length,
        active: chats.filter(c => !c.archived && !c.blocked).length,
        archived: chats.filter(c => c.archived).length,
        blocked: chats.filter(c => c.blocked).length
      },
      contacts: {
        total: contacts.length,
        new: contacts.filter(c => {
          const created = new Date(c.created_at);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return created > thirtyDaysAgo;
        }).length
      },
      performance: {
        deliveryRate: messages.length > 0 ? 
          (messages.filter(m => m.status === 'delivered').length / messages.filter(m => m.status === 'sent').length) * 100 : 0,
        readRate: messages.length > 0 ? 
          (messages.filter(m => m.status === 'read').length / messages.filter(m => m.status === 'sent').length) * 100 : 0
      }
    };

    // Gerar dados de timeline
    const timeline = generateTimelineData(messages, config);

    const report = {
      instanceKey,
      config,
      generatedAt: new Date().toISOString(),
      period: {
        start: config.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: config.endDate || new Date().toISOString()
      },
      metrics,
      timeline,
      summary: {
        totalMessages: metrics.messages.total,
        totalChats: metrics.chats.total,
        totalContacts: metrics.contacts.total,
        deliveryRate: metrics.performance.deliveryRate,
        readRate: metrics.performance.readRate
      }
    };

    console.log('✅ Relatório gerado');
    return NextResponse.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      data: report
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function generateTimelineData(messages: any[], config: any): Array<{ date: string; messages: number; chats: number }> {
  const groups: Record<string, { messages: number; chats: number }> = {};

  messages.forEach(message => {
    const date = new Date(message.created_at);
    let key: string;

    switch (config.groupBy || 'day') {
      case 'hour':
        key = date.toISOString().slice(0, 13) + ':00:00';
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }

    if (!groups[key]) {
      groups[key] = { messages: 0, chats: 0 };
    }

    groups[key].messages++;
  });

  return Object.entries(groups).map(([date, counts]) => ({
    date,
    messages: counts.messages,
    chats: counts.chats
  }));
}
