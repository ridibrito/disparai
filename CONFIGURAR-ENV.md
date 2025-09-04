# 🔧 CONFIGURAÇÃO DO ARQUIVO .env.local

## ❌ ERRO ATUAL
```
Error: Your project's URL and Key are required to create a Supabase client!
```

## ✅ SOLUÇÃO

### 1. Criar arquivo .env.local
Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```bash
# Configuração do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Meta WhatsApp Cloud API (configure depois)
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_ACCESS_TOKEN=your_access_token_here
META_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_API_VERSION=v18.0

# OpenAI (configure depois)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Google Calendar (opcional)
GOOGLE_SA_JSON_BASE64=
GOOGLE_CALENDAR_ID=primary

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
TZ=America/Sao_Paulo
```

### 2. Obter valores do Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Exemplo de como deve ficar
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MDAwMCwiZXhwIjoyMDE0MzM2MDAwfQ.exemplo-de-token-aqui
```

### 4. Reiniciar o servidor
Após criar o arquivo `.env.local`:
```bash
# Parar o servidor (Ctrl+C)
# Depois executar novamente:
npm run dev
```

## 🎯 RESULTADO ESPERADO
- ✅ Erro do Supabase resolvido
- ✅ Lista "teste" aparece no select
- ✅ Formulário de disparo funciona
