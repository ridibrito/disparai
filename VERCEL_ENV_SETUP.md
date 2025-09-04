# Configuração de Variáveis de Ambiente para Vercel

## Variáveis Obrigatórias

Configure as seguintes variáveis de ambiente no painel da Vercel:

### Configurações Básicas
```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Supabase (Banco de Dados)
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

### Disparai API (WhatsApp)
```bash
META_PHONE_NUMBER_ID=seu-phone-number-id
META_ACCESS_TOKEN=seu-access-token
META_VERIFY_TOKEN=seu-verify-token
WHATSAPP_API_VERSION=v20.0
```

### PostgreSQL (pg-boss)
```bash
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
```

## Variáveis Opcionais

### OpenAI (IA)
```bash
OPENAI_API_KEY=sua-chave-openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.3
```

### Google Calendar
```bash
GOOGLE_SA_JSON_BASE64=seu-json-base64
GOOGLE_CALENDAR_ID=primary
```

### Configurações Avançadas
```bash
TZ=America/Sao_Paulo
PORT=3000
CACHE_TTL=3600
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

## Como Configurar na Vercel

1. Acesse o painel da Vercel
2. Vá para o seu projeto
3. Clique em "Settings" > "Environment Variables"
4. Adicione cada variável com seu valor correspondente
5. Certifique-se de marcar "Production", "Preview" e "Development" conforme necessário

## Notas Importantes

- **NEXT_PUBLIC_APP_URL**: Deve ser a URL final do seu domínio na Vercel
- **SUPABASE_SERVICE_ROLE_KEY**: Mantenha esta chave segura, ela tem privilégios administrativos
- **META_ACCESS_TOKEN**: Token do WhatsApp, mantenha seguro
- **DATABASE_URL**: URL completa de conexão com PostgreSQL
- Todas as variáveis com `NEXT_PUBLIC_` são expostas no frontend
- Variáveis sem `NEXT_PUBLIC_` são apenas do servidor
