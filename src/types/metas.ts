// Tipos para a API de Metas v2.0

/**
 * Dia individual da meta distribuída
 * Usado no endpoint /metas/distribuida
 */
export interface MetaDia {
  dia: number;
  meta_valor: number;
  super_meta_valor?: number;
  peso_aplicado: number;
}

/**
 * Resposta do endpoint /metas/distribuida
 * Detalhe da meta de uma loja específica (dia a dia)
 */
export interface MetasDistribuidaResponse {
  dias: MetaDia[];
  total_meta_mes: number;
  sazonalidade_usada: 'PROPRIO' | 'PADRAO' | 'REGIONAL';
}

/**
 * Parâmetros para buscar meta distribuída
 */
export interface MetasDistribuidaParams {
  store_codigo: string;
  ano: number;
  mes: number;
}

/**
 * Meta de uma loja individual
 * Usado no endpoint /metas (visão regional)
 */
export interface MetaLoja {
  loja_codigo: string;
  meta: number;
}

/**
 * Resposta do endpoint /metas (visão regional/geral)
 */
export interface MetasRegionalResponse {
  metas: MetaLoja[];
}

/**
 * Parâmetros para buscar metas regionais
 */
export interface MetasRegionalParams {
  ano: number;
  mes: number;
}

/**
 * Status de performance da loja no ranking
 * Calculado no frontend cruzando metas com vendas
 */
export type PerformanceStatus = 'adiantado' | 'atrasado' | 'no_prazo';

/**
 * Item do ranking de lojas
 * Calculado no frontend
 */
export interface LojaRankingItem {
  loja_codigo: string;
  loja_nome: string;
  regional: string;
  meta_total: number;
  vendas_realizadas: number;
  percentual_atingido: number;
  status: PerformanceStatus;
}

/**
 * Modo de visualização do detalhe da loja
 */
export type MetasViewMode = 'calendario' | 'lista';

/**
 * Dados para o gráfico de sazonalidade
 */
export interface GraficoSazonalidadeData {
  labels: string[]; // Dias do mês
  metaAcumulada: number[]; // Linha tracejada - meta acumulada sazonal
  vendasReais: number[]; // Linha sólida - vendas reais
}

/**
 * Dados de pacing (ritmo)
 */
export interface PacingData {
  metaAcumuladaHoje: number; // Soma das metas até hoje
  vendasRealizadasHoje: number; // Total vendido até hoje
  diferenca: number; // Positivo = adiantado, Negativo = atrasado
  percentualDiferenca: number; // % em relação à meta esperada
  status: PerformanceStatus;
}

// ===== TIPOS PARA VENDAS DIÁRIAS (Histórico via Cache) =====

/**
 * Venda de um dia específico
 * Usado no endpoint /metas/vendas-diarias
 */
export interface VendaDiaria {
  data: string;      // "2026-01-05"
  dia: number;       // 5
  venda_total: number;
}

/**
 * Resposta do endpoint /metas/vendas-diarias
 * Histórico de vendas fechado (dia 1 até ontem) via cache Redis
 */
export interface VendasDiariasResponse {
  store_codigo: string;
  ano: number;
  mes: number;
  dias: VendaDiaria[];
  total_periodo: number;
  processado_em: string;
}

/**
 * Parâmetros para buscar vendas diárias
 */
export interface VendasDiariasParams {
  store_codigo: string;
  ano: number;
  mes: number;
}

/**
 * Dados combinados (Meta + Venda) para renderização
 * Fusão do histórico (cache) com dia atual (realtime)
 */
export interface DadoCombinado {
  dia: number;
  meta_valor: number;
  peso_aplicado: number;
  venda_realizada: number;
  diferenca: number;
  exibir_venda: boolean; // true se dia <= hoje
}
