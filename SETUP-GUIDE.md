# 🚀 Guia de Configuração - WhatsApp Cloud API

## 📋 Passo a Passo para Configurar o Banco

### 1. **Acesse o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: `doriuzvietifszgipexy`

### 2. **Execute o SQL de Setup**
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**
- Copie e cole todo o conteúdo do arquivo `setup-whatsapp.sql`
- Clique em **"Run"** para executar

### 3. **Verifique se as Tabelas Foram Criadas**
- No menu lateral, clique em **"Table Editor"**
- Você deve ver as seguintes tabelas:
  - ✅ `tenants`
  - ✅ `users`
  - ✅ `tenant_users`
  - ✅ `wa_accounts`
  - ✅ `contacts` ← **Esta é a tabela que estava faltando!**
  - ✅ `wa_templates`
  - ✅ `segments`
  - ✅ `campaigns`
  - ✅ `campaign_targets`
  - ✅ `conversations`
  - ✅ `messages`
  - ✅ `ai_sessions`
  - ✅ `handoffs`
  - ✅ `schedules`
  - ✅ `events_raw`

### 4. **Configure as Variáveis do WhatsApp**
Agora você precisa configurar as credenciais do WhatsApp no seu `.env.local`:

```bash
# META / WhatsApp Cloud API
META_PHONE_NUMBER_ID="seu_phone_number_id_aqui"
META_ACCESS_TOKEN="seu_access_token_aqui"
META_VERIFY_TOKEN="token_aleatorio_para_webhook"
WHATSAPP_API_VERSION="v20.0"

# OPENAI
OPENAI_API_KEY="sua_chave_openai_aqui"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_TEMPERATURE="0.3"
```

### 5. **Como Obter as Credenciais do WhatsApp**

#### **META_PHONE_NUMBER_ID:**
1. Acesse: https://developers.facebook.com/
2. Vá para seu app → WhatsApp → Getting Started
3. Copie o **Phone Number ID**

#### **META_ACCESS_TOKEN:**
1. No mesmo app, vá para **WhatsApp → Getting Started**
2. Clique em **"Generate Token"**
3. Copie o **Access Token**

#### **META_VERIFY_TOKEN:**
1. Crie um token aleatório (ex: `coruss_whatsapp_2024`)
2. Você vai usar este token para configurar o webhook

### 6. **Configure o Webhook no Meta**
1. No Meta Developer, vá para **WhatsApp → Webhook**
2. **URL**: `https://seudominio.com/api/whatsapp/webhook`
3. **Verify Token**: o mesmo que você definiu em `META_VERIFY_TOKEN`
4. **Subscribe to**: `messages`, `message_status`

### 7. **Teste a Configuração**
Após configurar tudo:

```bash
# Terminal 1: App Next.js
pnpm dev

# Terminal 2: Worker de filas
pnpm worker:broadcast

# Terminal 3: Teste da API
node examples/test-whatsapp.js
```

## 🔧 **Solução para o Erro Atual**

O erro `column "wa_phone_e164" does not exist` acontece porque:

1. ❌ A tabela `contacts` não foi criada
2. ❌ Ou a coluna `wa_phone_e164` não existe

**Solução:**
- Execute o SQL do arquivo `setup-whatsapp.sql` no Supabase
- Isso criará todas as tabelas e colunas necessárias

## 📱 **Estrutura da Tabela `contacts`**

Após executar o SQL, a tabela `contacts` terá:

```sql
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  wa_phone_e164 TEXT NOT NULL, -- ← Esta coluna será criada!
  name TEXT,
  tags TEXT[],
  opt_in_status TEXT DEFAULT 'pending',
  opt_in_source TEXT,
  opt_in_ts TIMESTAMPTZ,
  opt_out_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## ✅ **Checklist de Verificação**

- [ ] SQL executado no Supabase
- [ ] Tabela `contacts` criada com coluna `wa_phone_e164`
- [ ] Variáveis do WhatsApp configuradas no `.env.local`
- [ ] Webhook configurado no Meta Developer
- [ ] App rodando (`pnpm dev`)
- [ ] Worker rodando (`pnpm worker:broadcast`)

## 🆘 **Se Ainda Tiver Problemas**

1. **Verifique os logs** do Supabase Dashboard
2. **Confirme** se todas as tabelas foram criadas
3. **Teste** a conexão com a API do WhatsApp
4. **Verifique** se as variáveis de ambiente estão corretas

---

**🎯 Próximo passo:** Execute o SQL no Supabase e teste novamente!
