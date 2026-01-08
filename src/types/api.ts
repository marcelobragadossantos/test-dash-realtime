export interface Venda {
  codigo: string;
  loja: string;
  total_quantidade: number;
  venda_total: number;
  numero_vendas: number;
  regional: string;
  tempo_ultimo_envio: string;
  custo: number;
}

export interface VendasResponse {
  data_consulta: string;
  periodo_inicio: string;
  periodo_fim: string;
  total_registros: number;
  fonte: 'cache' | 'database';
  vendas: Venda[];
}

export interface VendasParams {
  data?: string;
  data_inicio?: string;
  data_fim?: string;
}

export type ViewMode = 'day' | 'month';

// Tipos para o endpoint /sync-status
export interface LojaSync {
  codigo: string;
  loja: string;
  regional: string;
  tempo_ultimo_recebimento: string | null;
  tempo_ultimo_envio: string | null;
}

export interface SyncStatusResponse {
  data_consulta: string;
  total_registros: number;
  lojas: LojaSync[];
}

// Tipos para o Portal Gateway
export interface PortalUser {
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  userRole: 'admin' | 'user' | null;
  moduleId: number | null;
  moduleName: string | null;
  timestamp: number | null;
}

// Tipos para RLS (Row-Level Security)
export type TabName = 'indicadores' | 'monitor' | 'rls';

export interface TabPermission {
  id?: string;
  userId: number;
  userName: string;
  allowedTabs: TabName[];
}

export interface StorePermission {
  id?: string;
  userId: number;
  userName: string;
  filterType: 'loja' | 'regional' | 'all';
  filterValues: string[]; // códigos de lojas ou nomes de regionais
}

export interface RLSConfig {
  tabPermissions: TabPermission[];
  storePermissions: StorePermission[];
}
