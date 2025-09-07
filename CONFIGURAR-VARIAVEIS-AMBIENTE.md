# 🔧 Configuração das Variáveis de Ambiente - Disparai

## ❌ Problema Atual
O arquivo `.env.local` está vazio ou não existe, causando erros na aplicação.

## ✅ Solução

### 1. Criar o arquivo .env.local

**Opção A - Automática:**
```bash
# Execute o script criado
create-env-local.bat
```

**Opção B - Manual:**
1. Copie o conteúdo do arquivo `env-variables.txt`
2. Crie um arquivo chamado `.env.local` na raiz do projeto
3. Cole o conteúdo copiado

### 2. Configurar Variáveis Obrigatórias

#### 🔴 SUPABASE (OBRIGATÓRIO)
```bash
# Obtenha estes valores em: https://supabase.com/dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
DATABASE_URL=postgresql://postgres:[SENHA]@db.seu-projeto.supabase.co:5432/postgres
```

**Como obter:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
   - **Database URL** → `DATABASE_URL` (substitua `[YOUR-PASSWORD]` pela senha)

### 3. Configurar Variáveis Opcionais

#### 🟡 META WHATSAPP CLOUD API (OPCIONAL)
```bash
# Configure se quiser usar a API oficial do WhatsApp
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_ACCESS_TOKEN=your_access_token_here
META_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_API_VERSION=v20.0
```

#### 🟡 DISPARAI API (UNOFFICIAL) (OPCIONAL)
```bash
# Configure se quiser usar a API não oficial do WhatsApp
DISPARAI_API_TOKEN=your_disparai_api_token_here
DISPARAI_API_BASE_URL=https://teste8.megaapi.com.br
```

#### 🟡 OPENAI (OPCIONAL)
```bash
# Configure se quiser usar IA para geração de mensagens
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.3
```

#### 🟡 GOOGLE CALENDAR (OPCIONAL)
```bash
# Configure se quiser integração com Google Calendar
GOOGLE_SA_JSON_BASE64=
GOOGLE_CALENDAR_ID=primary
```

### 4. Exemplo de Configuração Completa

```bash
# SUPABASE (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MDAwMCwiZXhwIjoyMDE0MzM2MDAwfQ.exemplo-de-token-aqui
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MDAwMCwiZXhwIjoyMDE0MzM2MDAwfQ.exemplo-de-token-aqui
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk4NzYwMDAwLCJleHAiOjIwMTQzMzYwMDB9.exemplo-de-service-role-key
DATABASE_URL=postgresql://postgres:senha123@db.abcdefghijklmnop.supabase.co:5432/postgres

# APLICAÇÃO
NEXT_PUBLIC_APP_URL=http://localhost:3000
TZ=America/Sao_Paulo

# OUTRAS CONFIGURAÇÕES (OPCIONAIS)
META_PHONE_NUMBER_ID=
META_ACCESS_TOKEN=
META_VERIFY_TOKEN=
WHATSAPP_API_VERSION=v20.0
DISPARAI_API_TOKEN=
DISPARAI_API_BASE_URL=https://teste8.megaapi.com.br
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.3
GOOGLE_SA_JSON_BASE64=
GOOGLE_CALENDAR_ID=primary
```

### 5. Reiniciar o Servidor

Após configurar o arquivo `.env.local`:

```bash
# Parar o servidor (Ctrl+C)
# Depois executar novamente:
npm run dev
```

## 🎯 Resultado Esperado

- ✅ Erro do Supabase resolvido
- ✅ Aplicação funcionando corretamente
- ✅ Conexão com banco de dados estabelecida
- ✅ Interface carregando sem erros

## 🔍 Verificação

Para verificar se as variáveis estão configuradas corretamente:

1. Abra o arquivo `.env.local`
2. Confirme que as variáveis do Supabase estão preenchidas
3. Verifique se não há espaços extras ou caracteres especiais
4. Reinicie o servidor de desenvolvimento

## 📞 Suporte

Se ainda houver problemas:

1. Verifique se o arquivo `.env.local` está na raiz do projeto
2. Confirme se as chaves do Supabase estão corretas
3. Verifique se o projeto Supabase está ativo
4. Consulte os logs do servidor para mais detalhes
