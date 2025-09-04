# DisparAI - WhatsApp Cloud API + OpenAI Integration

Sistema completo de disparo de mensagens WhatsApp com IA integrada, usando Next.js, Supabase e OpenAI.

## 🚀 Funcionalidades

- **WhatsApp Cloud API**: Envio de templates e mensagens livres
- **IA com OpenAI**: Atendimento automático inteligente
- **Janela de 24h**: Respeita as regras do WhatsApp Business
- **Opt-in/Opt-out**: Compliance com LGPD e Meta
- **Filas com pg-boss**: Rate limiting e retries automáticos
- **Multi-tenant**: Suporte a múltiplas organizações
- **RLS**: Segurança por tenant com Supabase

## 🛠 Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Filas**: pg-boss (PostgreSQL-based)
- **IA**: OpenAI GPT-4o-mini
- **WhatsApp**: Meta Cloud API
- **Auth**: Supabase Auth
- **Deploy**: Vercel + Supabase

## 📋 Pré-requisitos

1. **Meta Developer Account** com WhatsApp Business API
2. **Supabase Project** com PostgreSQL
3. **OpenAI API Key**
4. **Node.js 18+** e **pnpm**

## ⚙️ Configuração

### 1. Clone e instale dependências

```bash
git clone <seu-repo>
cd disparai
pnpm install
```

### 2. Configure as variáveis de ambiente

Copie `env.example` para `.env.local` e preencha:

```bash
# META / WhatsApp Cloud API
META_PHONE_NUMBER_ID="seu_phone_number_id"
META_ACCESS_TOKEN="seu_access_token"
META_VERIFY_TOKEN="token_aleatorio_para_webhook"
WHATSAPP_API_VERSION="v20.0"

# SUPABASE
SUPABASE_URL="sua_url_supabase"
SUPABASE_ANON_KEY="sua_chave_anonima"
SUPABASE_SERVICE_ROLE_KEY="sua_chave_service_role"

# POSTGRES (pg-boss)
DATABASE_URL="postgresql://user:pass@host:port/dbname"

# OPENAI
OPENAI_API_KEY="sua_chave_openai"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_TEMPERATURE="0.3"

# APP
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="America/Sao_Paulo"
```

### 3. Configure o banco de dados

Execute os SQLs na ordem:

```bash
# 1. Schema inicial
psql "$DATABASE_URL" -f sql/000_init.sql

# 2. Políticas RLS
psql "$DATABASE_URL" -f sql/010_rls.sql
```

### 4. Configure o Webhook no Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Vá para seu app → WhatsApp → Webhook
3. URL: `https://seudominio.com/api/whatsapp/webhook`
4. Verify Token: o mesmo que você definiu em `META_VERIFY_TOKEN`
5. Subscribe to: `messages`, `message_status`

## 🚀 Uso

### Desenvolvimento

```bash
# Terminal 1: App Next.js
pnpm dev

# Terminal 2: Worker de filas
pnpm worker:broadcast
```

### Produção

```bash
pnpm build
pnpm start
```

## 📱 APIs

### Enviar mensagem

```bash
POST /api/whatsapp/send
{
  "kind": "template", // ou "text"
  "to": ["+5511999999999"],
  "template": {
    "name": "boas_vindas",
    "language": "pt_BR"
  }
}
```

### Webhook (receber mensagens)

```
GET/POST /api/whatsapp/webhook
```

## 🤖 IA com OpenAI

O sistema usa OpenAI para:

- **Detectar intenções**: agendamento, preços, dúvidas
- **Responder automaticamente**: dentro da janela de 24h
- **Handoff humano**: quando necessário

### Customização

Edite `src/lib/ai.ts` para:

- Ajustar o prompt do sistema
- Adicionar novos intents
- Configurar regras de handoff

## 📊 Estrutura do Banco

### Tabelas principais

- **`tenants`**: Organizações
- **`contacts`**: Contatos com opt-in/opt-out
- **`conversations`**: Conversas com janela de 24h
- **`messages`**: Histórico de mensagens
- **`wa_templates`**: Templates aprovados
- **`campaigns`**: Campanhas de marketing
- **`ai_sessions`**: Contexto das conversas

## 🔒 Segurança

- **RLS**: Cada tenant vê apenas seus dados
- **Auth**: Supabase Auth integrado
- **Rate limiting**: 1 msg a cada 6s por contato
- **Opt-out**: Palavras-chave "SAIR", "STOP", "CANCELAR"

## 📈 Monitoramento

### Logs importantes

- **Webhook**: `/api/whatsapp/webhook`
- **Worker**: `pnpm worker:broadcast`
- **Database**: Supabase Dashboard

### Métricas

- Entregabilidade (sent/delivered/read)
- Opt-out rate
- Quality rating do WhatsApp
- Tempo de resposta da IA

## 🚨 Compliance

### WhatsApp Business

- ✅ Templates aprovados para marketing
- ✅ Janela de 24h respeitada
- ✅ Rate limiting implementado
- ✅ Opt-out automático

### LGPD

- ✅ Consentimento explícito
- ✅ Opt-out simples
- ✅ Auditoria completa
- ✅ Retenção controlada

## 🔧 Troubleshooting

### Problemas comuns

1. **Webhook não recebe mensagens**
   - Verifique `META_VERIFY_TOKEN`
   - Confirme URL no Meta Developer

2. **Rate limiting**
   - Ajuste `startAfter` nas filas
   - Monitore quality rating

3. **IA não responde**
   - Verifique `OPENAI_API_KEY`
   - Confirme modelo disponível

### Logs úteis

```bash
# Worker
pnpm worker:broadcast

# App
pnpm dev

# Database
psql "$DATABASE_URL"
```

## 🚀 Próximos passos

- [ ] Dashboard de métricas
- [ ] Integração com calendário
- [ ] A/B testing de templates
- [ ] Analytics avançados
- [ ] Multi-idioma
- [ ] Webhook de status

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs
2. Consulte a documentação do Meta
3. Abra uma issue no repositório

---

**DisparAI** - WhatsApp inteligente para sua empresa 🚀
