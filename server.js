import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da API (variáveis de ambiente do servidor)
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, '');
const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_BASE_URL) {
  console.error('❌ API_BASE_URL não está configurada');
  process.exit(1);
}

if (!API_SECRET_KEY) {
  console.error('❌ API_SECRET_KEY não está configurada');
  process.exit(1);
}

// Configuração CORS - permite Portal Gateway e outras origens
const corsOptions = {
  origin: true, // Permite qualquer origem
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Headers CORS adicionais para garantir compatibilidade
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve arquivos estáticos do frontend
app.use(express.static(join(__dirname, 'dist')));

// ==========================================
// Proxy Endpoints - Esconde URL e chave da API
// ==========================================

// Proxy para /vendas-realtime
app.get('/api/vendas-realtime', async (req, res) => {
  try {
    const url = new URL('/vendas-realtime', API_BASE_URL);

    // Repassa query params
    if (req.query.data) url.searchParams.append('data', req.query.data);
    if (req.query.data_inicio) url.searchParams.append('data_inicio', req.query.data_inicio);
    if (req.query.data_fim) url.searchParams.append('data_fim', req.query.data_fim);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Secret-Key': API_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro ao buscar vendas: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro no proxy /vendas-realtime:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Proxy para /sync-status
app.get('/api/sync-status', async (req, res) => {
  try {
    const url = new URL('/sync-status', API_BASE_URL);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Secret-Key': API_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro ao buscar sync-status: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro no proxy /sync-status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==========================================
// RLS (Row-Level Security) Endpoints
// ==========================================

const RLS_CONFIG_FILE = join(__dirname, 'rls-config.json');

// Carregar configuração RLS
function loadRLSConfig() {
  try {
    if (existsSync(RLS_CONFIG_FILE)) {
      const data = readFileSync(RLS_CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar RLS config:', error);
  }
  return { tabPermissions: [], storePermissions: [] };
}

// Salvar configuração RLS
function saveRLSConfig(config) {
  try {
    writeFileSync(RLS_CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar RLS config:', error);
    return false;
  }
}

// GET - Obter configuração RLS
app.get('/api/rls/config', (req, res) => {
  const config = loadRLSConfig();
  res.json(config);
});

// POST - Salvar configuração RLS
app.post('/api/rls/config', (req, res) => {
  const { tabPermissions, storePermissions } = req.body;

  const config = {
    tabPermissions: tabPermissions || [],
    storePermissions: storePermissions || [],
    updatedAt: new Date().toISOString(),
  };

  if (saveRLSConfig(config)) {
    res.json({ success: true, message: 'Configuração salva com sucesso' });
  } else {
    res.status(500).json({ success: false, error: 'Erro ao salvar configuração' });
  }
});

// GET - Verificar permissões de um usuário específico
app.get('/api/rls/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const config = loadRLSConfig();

  const tabPermission = config.tabPermissions.find(p => p.userId === userId);
  const storePermission = config.storePermissions.find(p => p.userId === userId);

  res.json({
    userId,
    tabs: tabPermission?.allowedTabs || ['indicadores', 'monitor'], // default: todas
    stores: storePermission || { filterType: 'all', filterValues: [] }, // default: todas
  });
});

// SPA fallback - todas outras rotas servem o index.html
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Inicia servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Proxy API configurado para: ${API_BASE_URL}`);
});
