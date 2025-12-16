# Configuração no Easypanel

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Easypanel:

### 1. VITE_API_BASE_URL
- **Descrição**: URL base da sua API
- **Formato**: URL completa sem barra no final
- **Exemplo**: `https://sua-url-easypanel.com`

### 2. VITE_API_SECRET_KEY
- **Descrição**: Chave secreta para autenticação
- **Uso**: Enviada no header `X-Secret-Key` nas requisições
- **Exemplo**: `sua-chave-secreta-aqui`

## Informações da API

- **Endpoint**: `/vendas-realtime`
- **Método**: GET
- **Autenticação**: Header `X-Secret-Key`

### Parâmetros de Query Opcionais

| Parâmetro | Formato | Descrição |
|-----------|---------|-----------|
| data | YYYY-MM-DD | Data específica |
| data_inicio | YYYY-MM-DD | Início do período |
| data_fim | YYYY-MM-DD | Fim do período |

### Exemplos de Requisição

- Dia atual: `GET /vendas-realtime`
- Data específica: `GET /vendas-realtime?data=2025-12-10`
- Período: `GET /vendas-realtime?data_inicio=2025-12-01&data_fim=2025-12-15`

## Como Configurar no Easypanel

1. Acesse o painel do seu projeto no Easypanel
2. Vá para a seção de **Environment Variables**
3. Adicione as duas variáveis:
   - `VITE_API_BASE_URL`
   - `VITE_API_SECRET_KEY`
4. Salve as configurações
5. Faça o redeploy da aplicação

## Verificação

Após configurar, a aplicação deve carregar os dados automaticamente ao iniciar.
