@echo off
echo ==========================================
echo CRIANDO ARQUIVO .env.local PARA DISPARAI
echo ==========================================
echo.

REM Copia o arquivo de exemplo para .env.local
copy env-variables.txt .env.local

echo Arquivo .env.local criado com sucesso!
echo.
echo IMPORTANTE: Configure as seguintes variáveis:
echo.
echo 1. SUPABASE (OBRIGATÓRIO):
echo    - Acesse: https://supabase.com/dashboard
echo    - Selecione seu projeto
echo    - Vá em Settings ^> API
echo    - Copie Project URL e as chaves
echo    - Substitua os valores no arquivo .env.local
echo.
echo 2. DATABASE_URL:
echo    - Use a mesma URL do Supabase
echo    - Substitua [SENHA] pela senha do seu banco
echo.
echo 3. Outras configurações são opcionais
echo.
echo Pressione qualquer tecla para abrir o arquivo .env.local...
pause >nul

REM Abre o arquivo .env.local no editor padrão
start .env.local

echo.
echo Arquivo .env.local aberto para edição!
echo Configure as variáveis e salve o arquivo.
echo.
echo Após configurar, execute: npm run dev
echo.
pause
