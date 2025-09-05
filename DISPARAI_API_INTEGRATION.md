# Integração API Disparai (não oficial) - WhatsApp

Este documento descreve a integração completa com a API Disparai (não oficial) para envio de mensagens WhatsApp.

## 📋 Visão Geral

A API Disparai é uma solução avançada para integração com WhatsApp que permite:
- Mensagens ilimitadas
- Envio de mídia (imagens, vídeos, documentos, áudios)
- Webhooks em tempo real
- Download de mídia recebida
- Relatórios detalhados

## 🔧 Configuração

### 1. Credenciais Necessárias

Para usar a API Disparai, você precisa de:
- **Instance Key**: Identificador único da sua instância WhatsApp
- **Token de Acesso**: Token de autenticação para a API

### 2. Endpoints Principais

#### Status da Instância
```
GET https://teste8.megaapi.com.br/rest/instance/{instance_key}
Authorization: Bearer {token}
```

#### Envio de Mensagem de Texto
```
POST https://teste8.megaapi.com.br/rest/instance/sendMessage/{instance_key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "+5511999999999",
  "message": "Sua mensagem aqui"
}
```

#### Envio de Mídia
```
POST https://teste8.megaapi.com.br/rest/instance/sendMedia/{instance_key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "+5511999999999",
  "mediaType": "image",
  "mediaUrl": "https://exemplo.com/imagem.jpg",
  "caption": "Legenda da imagem"
}
```

#### Download de Mídia
```
POST https://teste8.megaapi.com.br/rest/instance/downloadMediaMessage/{instance_key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "messageType": "image",
  "mediaKey": "chave_da_midia",
  "directPath": "caminho_direto",
  "url": "url_da_midia",
  "mimetype": "image/jpeg"
}
```

## 🚀 Implementação

### 1. Cliente API Disparai

```typescript
import { createDisparaiAPIClient } from '@/lib/disparai-api';

const client = createDisparaiAPIClient('sua_instance_key', 'seu_token');

// Enviar mensagem de texto
const result = await client.sendTextMessage('+5511999999999', 'Olá!');

// Enviar mídia
const mediaResult = await client.sendMediaMessage(
  '+5511999999999',
  'image',
  'https://exemplo.com/imagem.jpg',
  'Legenda da imagem'
);
```

### 2. API Routes

#### Envio de Mensagens
```
POST /api/disparai/send
{
  "instanceKey": "sua_instance_key",
  "apiToken": "seu_token",
  "to": "+5511999999999",
  "message": "Sua mensagem",
  "messageType": "text"
}
```

#### Webhook
```
POST /api/disparai/webhook
```

### 3. Validação de Credenciais

O sistema valida automaticamente as credenciais da API Disparai verificando:
- Token de acesso válido
- Instance Key existente
- Status da instância (deve estar "connected")

## 📱 Interface do Usuário

### Configuração de Conexão

1. Acesse **Configurações > Conexões API**
2. Clique em **Nova Conexão**
3. Selecione **API Disparai (não oficial)**
4. Preencha:
   - **Nome da Conexão**: Nome descritivo
   - **Instance Key**: Sua chave de instância
   - **Token de Acesso**: Seu token de autenticação
   - **URL do Webhook**: (Opcional) Para receber notificações
5. Clique em **Validar Conexão** para testar
6. Salve a conexão

### Validação em Tempo Real

O sistema valida as credenciais em tempo real e mostra:
- ✅ Status da instância
- ✅ Permissões disponíveis
- ✅ Recursos habilitados
- ❌ Erros específicos com orientações

## 🔄 Webhook

### Configuração

Configure o webhook no painel da Disparai apontando para:
```
https://seu-dominio.com/api/disparai/webhook
```

### Estrutura do Webhook

```json
{
  "instance": "sua_instance_key",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "mensagem_id"
    },
    "message": {
      "conversation": "Texto da mensagem",
      "imageMessage": {
        "caption": "Legenda",
        "url": "url_da_imagem"
      }
    },
    "messageTimestamp": 1640995200,
    "status": "received"
  }
}
```

### Tipos de Mensagem Suportados

- **Texto**: `conversation`, `extendedTextMessage`
- **Imagem**: `imageMessage`
- **Vídeo**: `videoMessage`
- **Áudio**: `audioMessage`
- **Documento**: `documentMessage`

## 🛠️ Utilitários

### Formatação de Telefone

```typescript
import { formatPhoneToE164, validatePhoneNumber } from '@/lib/disparai-api';

// Validar número
const isValid = validatePhoneNumber('11999999999'); // true

// Formatar para E164
const formatted = formatPhoneToE164('11999999999'); // +5511999999999
```

### Tratamento de Erros

```typescript
const result = await client.sendTextMessage('+5511999999999', 'Teste');

if (result.error) {
  console.error('Erro:', result.message);
  // Tratar erro específico
} else {
  console.log('Sucesso:', result.data);
}
```

## 📊 Monitoramento

### Logs

O sistema registra automaticamente:
- Mensagens enviadas
- Mensagens recebidas via webhook
- Erros de validação
- Status das conexões

### Métricas

- Total de mensagens enviadas
- Taxa de sucesso
- Tempo de resposta
- Status das instâncias

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha** Instance Key e Token em frontend
2. **Use HTTPS** para webhooks
3. **Valide** todas as entradas
4. **Monitore** logs de acesso
5. **Rotacione** tokens periodicamente

### Armazenamento Seguro

As credenciais são armazenadas de forma segura no banco de dados com:
- Criptografia de campos sensíveis
- Políticas RLS (Row Level Security)
- Auditoria de acesso

## 🆘 Solução de Problemas

### Erros Comuns

#### 401 - Unauthorized
- Verifique se o token está correto
- Confirme se o token não expirou

#### 404 - Instance Not Found
- Verifique se a Instance Key está correta
- Confirme se a instância existe no painel

#### 403 - Forbidden
- Verifique as permissões da conta
- Confirme se a instância está ativa

### Status da Instância

- **connected**: Instância funcionando normalmente
- **disconnected**: Instância desconectada
- **connecting**: Tentando conectar
- **error**: Erro na instância

## 📚 Recursos Adicionais

- [Documentação Oficial API Disparai (Servidor de Testes)](https://teste8.megaapi.com.br/docs/#/)
- [Painel de Controle Disparai](https://painel.megaapi.com.br/)
- [Suporte Técnico](https://suporte.megaapi.com.br/)

## 🧪 Servidor de Testes

O projeto está configurado para usar o servidor de testes da MegaAPI:
- **Host**: https://teste8.megaapi.com.br/
- **Swagger**: https://teste8.megaapi.com.br/docs/#/
- **Status**: ✅ Conectado e funcionando

Para usar o servidor de produção, altere a URL base no arquivo `src/lib/disparai-api.ts`.

## 🔄 Atualizações

### Versão Atual: 1.0.0

- ✅ Validação de credenciais
- ✅ Envio de mensagens de texto
- ✅ Envio de mídia
- ✅ Webhook handler
- ✅ Interface de configuração
- ✅ Tratamento de erros

### Próximas Versões

- 🔄 Download automático de mídia
- 🔄 Relatórios avançados
- 🔄 Agendamento de mensagens
- 🔄 Templates de mensagem
- 🔄 Automação de respostas
