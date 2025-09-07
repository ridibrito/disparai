# Sistema de Sincronização de Status

## 📋 Visão Geral

Este sistema garante que o status das instâncias WhatsApp no banco de dados esteja sempre sincronizado com o status real no servidor MegaAPI.

## 🔧 Componentes

### 1. API de Sincronização (`/api/sync-instance-status`)

**GET**: Verifica status sem atualizar
- Retorna lista de instâncias e seus status
- Indica quais precisam de sincronização

**POST**: Executa sincronização
- Compara status do banco vs servidor
- Atualiza banco de dados quando necessário
- Retorna relatório de alterações

### 2. Cron Job (`/api/cron/sync-status`)

- Executa automaticamente a cada 5 minutos
- Pode ser chamado manualmente
- Protegido por token de autenticação

### 3. Webhook Melhorado (`/api/webhooks/whatsapp/[organizationId]`)

- Logs detalhados com timestamps
- Medição de tempo de processamento
- Tratamento robusto de erros
- Validação de dados

### 4. Interface de Usuário

- Botão "Sincronizar Status" no frontend
- Feedback visual durante sincronização
- Notificações de sucesso/erro

## 🚀 Como Usar

### Sincronização Manual

1. **Via Interface**: Clique no botão "Sincronizar Status" na página de conexões
2. **Via API**: 
   ```bash
   curl -X POST http://localhost:3000/api/sync-instance-status
   ```

### Verificação de Status

```bash
curl -X GET http://localhost:3000/api/sync-instance-status
```

### Cron Job Manual

```bash
curl -X GET http://localhost:3000/api/cron/sync-status
```

## 📊 Logs e Monitoramento

### Logs do Webhook
- `📨 [WEBHOOK]` - Recebimento de webhook
- `🔍 [WEBHOOK]` - Processamento de evento
- `✅ [WEBHOOK]` - Sucesso com tempo de processamento
- `❌ [WEBHOOK]` - Erro com detalhes

### Logs de Sincronização
- `🔄` - Início de sincronização
- `📱` - Instâncias encontradas
- `📊` - Status no servidor
- `✅` - Status sincronizado
- `❌` - Erro na sincronização

## ⚙️ Configuração

### Variáveis de Ambiente

```env
MEGA_API_HOST=https://teste8.megaapi.com.br
MEGA_API_TOKEN=seu_token_aqui
CRON_SECRET=seu_secret_para_cron
```

### Vercel Cron

O arquivo `vercel.json` configura execução automática a cada 5 minutos:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-status",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Status não sincroniza**
   - Verificar logs do webhook
   - Executar sincronização manual
   - Verificar conectividade com MegaAPI

2. **Cron não executa**
   - Verificar configuração do Vercel
   - Verificar token CRON_SECRET
   - Verificar logs do Vercel

3. **Webhook não recebe notificações**
   - Verificar URL do webhook no MegaAPI
   - Verificar logs de rede
   - Testar webhook manualmente

### Comandos de Debug

```bash
# Verificar status atual
curl -X GET http://localhost:3000/api/sync-instance-status

# Forçar sincronização
curl -X POST http://localhost:3000/api/sync-instance-status

# Testar webhook
curl -X POST http://localhost:3000/api/webhooks/whatsapp/ORGANIZATION_ID \
  -H "Content-Type: application/json" \
  -d '{"instanceKey":"INSTANCE_KEY","event":"connection","data":{"status":"connected"}}'
```

## 📈 Benefícios

- ✅ **Sincronização automática** a cada 5 minutos
- ✅ **Sincronização manual** via interface
- ✅ **Logs detalhados** para debugging
- ✅ **Tratamento robusto** de erros
- ✅ **Monitoramento** de performance
- ✅ **Interface amigável** para usuários
