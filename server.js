import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
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

// ==========================================
// Configuração do Banco de Dados (PostgreSQL)
// ==========================================

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

if (DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  console.log('📦 Banco de dados configurado');
} else {
  console.warn('⚠️ DATABASE_URL não configurada - RLS usará memória (dados não persistentes)');
}

// Criar tabela de permissões se não existir
async function initDatabase() {
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendas_permissoes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255),
        permission_type VARCHAR(50) NOT NULL,
        allowed_tabs TEXT[],
        filter_type VARCHAR(50),
        filter_values TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_type)
      )
    `);
    console.log('✅ Tabela vendas_permissoes verificada/criada');
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
  }
}

// Inicializa o banco ao iniciar
initDatabase();

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

// Fallback em memória quando não há banco configurado
let memoryStore = { tabPermissions: [], storePermissions: [] };

// GET - Obter configuração RLS
app.get('/api/rls/config', async (req, res) => {
  try {
    if (!pool) {
      return res.json(memoryStore);
    }

    const result = await pool.query('SELECT * FROM vendas_permissoes ORDER BY user_id');

    const tabPermissions = [];
    const storePermissions = [];

    for (const row of result.rows) {
      if (row.permission_type === 'tab') {
        tabPermissions.push({
          id: row.id.toString(),
          userId: row.user_id,
          userName: row.user_name || '',
          allowedTabs: row.allowed_tabs || []
        });
      } else if (row.permission_type === 'store') {
        storePermissions.push({
          id: row.id.toString(),
          userId: row.user_id,
          userName: row.user_name || '',
          filterType: row.filter_type || 'all',
          filterValues: row.filter_values || []
        });
      }
    }

    res.json({ tabPermissions, storePermissions });
  } catch (error) {
    console.error('Erro ao carregar RLS config:', error);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

// POST - Salvar configuração RLS
app.post('/api/rls/config', async (req, res) => {
  const { tabPermissions, storePermissions } = req.body;

  try {
    if (!pool) {
      // Fallback em memória
      memoryStore = { tabPermissions: tabPermissions || [], storePermissions: storePermissions || [] };
      return res.json({ success: true, message: 'Configuração salva em memória (sem banco)' });
    }

    // Limpar permissões existentes e inserir novas
    await pool.query('BEGIN');

    try {
      // Deletar todas permissões existentes
      await pool.query('DELETE FROM vendas_permissoes');

      // Inserir permissões de tabs
      for (const perm of (tabPermissions || [])) {
        await pool.query(
          `INSERT INTO vendas_permissoes (user_id, user_name, permission_type, allowed_tabs)
           VALUES ($1, $2, 'tab', $3)`,
          [perm.userId, perm.userName || '', perm.allowedTabs || []]
        );
      }

      // Inserir permissões de lojas
      for (const perm of (storePermissions || [])) {
        await pool.query(
          `INSERT INTO vendas_permissoes (user_id, user_name, permission_type, filter_type, filter_values)
           VALUES ($1, $2, 'store', $3, $4)`,
          [perm.userId, perm.userName || '', perm.filterType || 'all', perm.filterValues || []]
        );
      }

      await pool.query('COMMIT');
      res.json({ success: true, message: 'Configuração salva com sucesso' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao salvar RLS config:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar configuração' });
  }
});

// GET - Verificar permissões de um usuário específico
app.get('/api/rls/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    if (!pool) {
      // Fallback em memória
      const tabPermission = memoryStore.tabPermissions.find(p => p.userId === userId);
      const storePermission = memoryStore.storePermissions.find(p => p.userId === userId);
      return res.json({
        userId,
        tabs: tabPermission?.allowedTabs || ['indicadores', 'monitor'],
        stores: storePermission || { filterType: 'all', filterValues: [] }
      });
    }

    const result = await pool.query(
      'SELECT * FROM vendas_permissoes WHERE user_id = $1',
      [userId]
    );

    let tabs = ['indicadores', 'monitor']; // default
    let stores = { filterType: 'all', filterValues: [] }; // default

    for (const row of result.rows) {
      if (row.permission_type === 'tab') {
        tabs = row.allowed_tabs || [];
      } else if (row.permission_type === 'store') {
        stores = {
          filterType: row.filter_type || 'all',
          filterValues: row.filter_values || []
        };
      }
    }

    res.json({ userId, tabs, stores });
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
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
