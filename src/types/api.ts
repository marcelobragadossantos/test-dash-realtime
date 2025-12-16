export interface Venda {
  codigo: string;
  loja: string;
  total_quantidade: number;
  venda_total: number;
  numero_vendas: number;
  regional: string;
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
