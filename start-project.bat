@echo off
echo Iniciando o projeto DisparAI...

echo Verificando se o arquivo .env.local existe...
if not exist .env.local (
    echo ERRO: Arquivo .env.local nao encontrado!
    echo Por favor, crie o arquivo .env.local com base no .env.example
    echo com suas credenciais do Supabase antes de continuar.
    pause
    exit /b 1
)

echo Instalando dependencias...
call npm install

echo Iniciando o servidor de desenvolvimento...
call npm run dev