# Corrigir Erro de CORS

## Problema

A aplicação está apresentando erro de CORS (Cross-Origin Resource Sharing):

```
Erro de CORS
vendas-realtime?data=2025-12-16
```

Isso acontece porque o backend não está configurado para aceitar requisições do frontend.

## Solução - Configurar CORS no Backend

Você precisa configurar o backend da API para permitir requisições do frontend.

### Se estiver usando FastAPI (Python):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://seu-frontend.easypanel.host",  # URL do seu frontend
        "http://localhost:5173",  # Para desenvolvimento local
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Se estiver usando Express (Node.js):

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Configurar CORS
app.use(cors({
  origin: [
    'https://seu-frontend.easypanel.host',  // URL do seu frontend
    'http://localhost:5173'  // Para desenvolvimento local
  ],
  credentials: true
}));
```

### Se estiver usando Flask (Python):

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Configurar CORS
CORS(app, origins=[
    "https://seu-frontend.easypanel.host",  # URL do seu frontend
    "http://localhost:5173"  # Para desenvolvimento local
])
```

## Opção Alternativa - Permitir Todas as Origens (Apenas para Desenvolvimento)

⚠️ **NÃO RECOMENDADO PARA PRODUÇÃO**

```python
# FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Para Produção

Sempre especifique as origens permitidas:

```python
allow_origins=[
    "https://seu-frontend.easypanel.host",
]
```

## Após Configurar

1. Faça o redeploy do backend no Easypanel
2. Aguarde alguns segundos
3. Recarregue o frontend
4. Os dados devem carregar corretamente ✅

## Verificação

Se funcionou, você verá:
- Status 200 nas requisições no DevTools
- Dados carregando na tela
- Sem erros de CORS no console
