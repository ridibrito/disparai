# 🔧 Configuração do Webhook da MegaAPI

## ❌ Problema Identificado
O webhook está funcionando localmente, mas a MegaAPI não consegue acessar o servidor local (`localhost:3000`) da internet.

**Status atual:**
- ✅ Webhook funcionando localmente
- ✅ Processamento de mensagens implementado
- ❌ Servidor não acessível da internet
- ❌ MegaAPI não consegue enviar webhooks

## 🚀 Soluções Possíveis

### 1. Usar ngrok (Recomendado para desenvolvimento)

**Opção A: Download manual**
1. Baixe o ngrok em: https://ngrok.com/download
2. Extraia o arquivo
3. Execute: `ngrok http 3000`

**Opção B: Via PowerShell (se o download automático não funcionar)**
```powershell
# Baixar ngrok
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "ngrok.zip"

# Extrair (pode ser bloqueado pelo Windows Defender)
Expand-Archive -Path "ngrok.zip" -DestinationPath "." -Force

# Executar
.\ngrok.exe http 3000
```

**Depois use a URL do ngrok no painel da MegaAPI:**
```
https://seu-id.ngrok.io/api/webhooks/whatsapp/coruss-whatsapp-01
```

### 2. Deploy em produção
- Deploy em Vercel, Railway, ou outro serviço
- Use a URL de produção no painel da MegaAPI

### 3. Verificar configuração atual
- URL atual no painel: `http://localhost:3000/api/webhooks/whatsapp/coruss-whatsapp-01`
- Esta URL só funciona localmente, não da internet

## ✅ Teste do Webhook
O webhook está funcionando corretamente quando testado localmente:

**Teste GET:**
```bash
curl -X GET "http://localhost:3000/api/webhooks/whatsapp/coruss-whatsapp-01"
```

**Teste POST:**
```bash
curl -X POST "http://localhost:3000/api/webhooks/whatsapp/coruss-whatsapp-01" \
  -H "Content-Type: application/json" \
  -d '{"instanceKey": "coruss-whatsapp-01", "event": "message", "data": {"from": "5511999999999", "body": "Teste", "type": "text", "timestamp": 1736619200, "messageId": "test_123"}}'
```

## 📋 Próximos Passos
1. **Configure ngrok** ou faça deploy
2. **Atualize a URL do webhook** no painel da MegaAPI
3. **Teste com uma mensagem real**
4. **Verifique se a mensagem aparece** na interface

## 🔍 Debug
- Logs detalhados foram adicionados ao webhook
- Qualquer tentativa de acesso será registrada no console
- Verifique os logs do servidor para ver se há tentativas de acesso
