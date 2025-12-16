# Dashboard de Vendas Real Time

Dashboard mobile-first para visualização de vendas por loja em tempo real. Interface responsiva otimizada para dispositivos móveis, mas também funciona perfeitamente em desktop.

## Funcionalidades

- **Visualização por Dia**: Consulta vendas de um dia específico
- **Visualização por Mês**: Consulta vendas consolidadas do mês
- **Navegação de Datas**: Botões para avançar/voltar datas (D-1/D+1 ou Mês anterior/próximo)
- **Seletor de Data**: Calendário para escolher data específica
- **Ranking de Lojas**: Vendas ordenadas por valor total
- **Métricas Consolidadas**: Total de vendas e quantidade
- **Ticket Médio**: Cálculo automático por loja
- **Auto-refresh**: Atualização automática a cada 5 minutos
- **Cache Indicator**: Mostra se os dados vieram do cache ou database

## Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **TailwindCSS** - Estilização
- **React Query** - Gerenciamento de estado e cache
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## Pré-requisitos

- Node.js 20 ou superior
- npm ou yarn

## Configuração

1. Clone o repositório
2. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente no arquivo `.env`:

```env
VITE_API_BASE_URL=https://sua-api.com
VITE_API_SECRET_KEY=sua-chave-secreta
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## Build

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`

## Preview da Build

```bash
npm run preview
```

## Deploy no EasyPanel

O projeto está configurado para deploy no EasyPanel usando Nixpacks.

### Configuração no EasyPanel:

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente:
   - `VITE_API_BASE_URL`: URL base da API
   - `VITE_API_SECRET_KEY`: Chave secreta para autenticação
3. O EasyPanel detectará automaticamente o `nixpacks.toml`
4. Deploy automático!

### Arquivo nixpacks.toml

O projeto já inclui o arquivo de configuração necessário para o EasyPanel.

## Estrutura do Projeto

```
src/
├── components/
│   ├── Dashboard.tsx       # Componente principal
│   ├── DateNavigator.tsx   # Navegação de datas
│   └── VendasList.tsx      # Lista de vendas
├── hooks/
│   └── useVendas.ts        # Hook React Query
├── services/
│   └── api.ts              # Cliente da API
├── types/
│   └── api.ts              # Tipos TypeScript
├── App.tsx                 # App root com providers
├── main.tsx                # Entry point
└── index.css               # Estilos globais
```

## API

O dashboard consome a API de vendas real time com os seguintes endpoints:

### GET /vendas-realtime

**Headers:**
- `X-Secret-Key`: Chave de autenticação

**Query Params:**
- `data` (opcional): Data específica (YYYY-MM-DD)
- `data_inicio` (opcional): Data início do período (YYYY-MM-DD)
- `data_fim` (opcional): Data fim do período (YYYY-MM-DD)

**Resposta:**
```json
{
  "data_consulta": "2025-12-15T21:30:00-03:00",
  "periodo_inicio": "2025-12-01 00:00:00",
  "periodo_fim": "2025-12-15 23:59:59",
  "total_registros": 5,
  "fonte": "database",
  "vendas": [
    {
      "codigo": "001",
      "loja": "Loja Centro",
      "total_quantidade": 500.00,
      "venda_total": 15000.00
    }
  ]
}
```

## Recursos Mobile-First

- Design otimizado para telas pequenas
- Touch-friendly com botões grandes
- Viewport configurado para prevenir zoom indesejado
- Layout responsivo com breakpoints
- Performance otimizada para conexões lentas

## Licença

MIT