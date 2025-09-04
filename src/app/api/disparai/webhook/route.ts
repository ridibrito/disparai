import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webhookSchema = z.object({
  instance: z.string(),
  server_url: z.string().optional(),
  apikey: z.string().optional(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({
        text: z.string(),
      }).optional(),
      imageMessage: z.object({
        caption: z.string().optional(),
        url: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      videoMessage: z.object({
        caption: z.string().optional(),
        url: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      audioMessage: z.object({
        url: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      documentMessage: z.object({
        caption: z.string().optional(),
        url: z.string().optional(),
        mimetype: z.string().optional(),
        fileName: z.string().optional(),
      }).optional(),
    }),
    messageTimestamp: z.number(),
    status: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = webhookSchema.parse(body);

    const { instance, data } = validatedData;
    const { key, message, messageTimestamp, status } = data;

    // Extrair informações da mensagem
    const messageId = key.id;
    const from = key.remoteJid;
    const timestamp = new Date(messageTimestamp * 1000).toISOString();
    const isFromMe = key.fromMe;

    // Determinar tipo de mensagem e conteúdo
    let messageType = 'text';
    let content = '';
    let mediaUrl = '';
    let mediaType = '';
    let caption = '';

    if (message.conversation) {
      // Mensagem de texto simples
      content = message.conversation;
    } else if (message.extendedTextMessage) {
      // Mensagem de texto estendida
      content = message.extendedTextMessage.text;
    } else if (message.imageMessage) {
      // Mensagem de imagem
      messageType = 'image';
      content = message.imageMessage.caption || '';
      mediaUrl = message.imageMessage.url || '';
      mediaType = 'image';
      caption = message.imageMessage.caption || '';
    } else if (message.videoMessage) {
      // Mensagem de vídeo
      messageType = 'video';
      content = message.videoMessage.caption || '';
      mediaUrl = message.videoMessage.url || '';
      mediaType = 'video';
      caption = message.videoMessage.caption || '';
    } else if (message.audioMessage) {
      // Mensagem de áudio
      messageType = 'audio';
      content = 'Áudio';
      mediaUrl = message.audioMessage.url || '';
      mediaType = 'audio';
    } else if (message.documentMessage) {
      // Mensagem de documento
      messageType = 'document';
      content = message.documentMessage.caption || message.documentMessage.fileName || 'Documento';
      mediaUrl = message.documentMessage.url || '';
      mediaType = 'document';
      caption = message.documentMessage.caption || '';
    }

    // Log da mensagem recebida
    console.log('API Disparai Webhook recebido:', {
      instance,
      messageId,
      from,
      messageType,
      content,
      mediaUrl,
      mediaType,
      caption,
      timestamp,
      status,
      isFromMe
    });

    // Aqui você pode processar a mensagem conforme necessário:
    // - Salvar no banco de dados
    // - Enviar para um sistema de IA
    // - Disparar notificações
    // - etc.

    // Exemplo de resposta para confirmação
    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: {
        messageId,
        processed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erro de validação no webhook API Disparai:', error.errors);
      return NextResponse.json(
        {
          success: false,
          message: 'Dados do webhook inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro no webhook API Disparai:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificação do webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    return new NextResponse(challenge);
  }
  
  return NextResponse.json({
    success: true,
    message: 'API Disparai Webhook endpoint ativo',
    timestamp: new Date().toISOString()
  });
}
