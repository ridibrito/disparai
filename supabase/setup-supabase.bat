@echo off
echo Configurando tabelas no Supabase para o projeto DisparAI...

echo Verificando se o arquivo .env.local existe...
if not exist ../.env.local (
    echo ERRO: Arquivo .env.local nao encontrado!
    echo Por favor, crie o arquivo .env.local com suas credenciais do Supabase antes de continuar.
    pause
    exit /b 1
)

echo Abrindo o Supabase Studio no navegador...
start https://app.supabase.com/project/doriuzvietifszgipexy/sql

echo.
echo Instrucoes:
echo 1. No Supabase Studio, clique em "New Query"
echo 2. Copie e cole o conteudo do arquivo setup_tables.sql
echo 3. Clique em "Run" para executar o script e criar todas as tabelas
echo.
echo Abrindo o arquivo setup_tables.sql...
start notepad setup_tables.sql

echo.
echo Apos executar o script SQL, verifique se as tabelas foram criadas corretamente
echo acessando a secao "Table Editor" no menu lateral do Supabase Studio.
echo.

pause