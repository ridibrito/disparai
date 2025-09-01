# Configuração do Supabase para o DisparAI

Este diretório contém os arquivos necessários para configurar o banco de dados Supabase para o projeto DisparAI.

## Projeto Supabase

O projeto Supabase já foi criado com o ID: `doriuzvietifszgipexy`

Você pode acessá-lo diretamente através do link:
[https://app.supabase.com/project/doriuzvietifszgipexy](https://app.supabase.com/project/doriuzvietifszgipexy)

Caso precise criar um novo projeto, siga estas etapas:

1. Acesse [app.supabase.com](https://app.supabase.com) e faça login na sua conta
2. Clique em "New Project"
3. Selecione sua organização ou crie uma nova
4. Dê um nome ao projeto (ex: "disparai")
5. Escolha uma senha forte para o banco de dados
6. Selecione a região mais próxima de você
7. Clique em "Create new project"

## Configurando as tabelas do banco de dados

### Método 1: Usando o script de configuração

1. Execute o arquivo `setup-supabase.bat` neste diretório
2. O script abrirá automaticamente o Supabase Studio no navegador e o arquivo SQL no bloco de notas
3. Siga as instruções exibidas no prompt de comando

### Método 2: Configuração manual

1. Acesse o **SQL Editor** no menu lateral do [Supabase Studio](https://app.supabase.com/project/doriuzvietifszgipexy/sql)
2. Clique em "New Query"
3. Copie e cole o conteúdo do arquivo `setup_tables.sql` no editor
4. Clique em "Run" para executar o script e criar todas as tabelas necessárias

## Configurando as variáveis de ambiente

Após criar o projeto, você precisará configurar as variáveis de ambiente no arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

Você pode encontrar essas informações na seção **Project Settings** > **API** do seu projeto Supabase.

## Verificando a instalação

Para verificar se as tabelas foram criadas corretamente:

1. Acesse a seção **Table Editor** no menu lateral
2. Você deverá ver todas as tabelas listadas no painel esquerdo
3. Verifique se os planos padrão foram inseridos na tabela `plans`

## Próximos passos

Com o banco de dados configurado, você pode prosseguir com:

1. Implementação do sistema de autenticação
2. Desenvolvimento do sistema de gestão de assinaturas
3. Criação da interface de usuário