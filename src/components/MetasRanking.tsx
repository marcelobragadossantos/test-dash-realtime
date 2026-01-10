import { useMemo } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Store, Target } from 'lucide-react';
import { LojaRankingItem, PerformanceStatus } from '../types/metas';
import { Venda } from '../types/api';

interface MetasRankingProps {
  metas: { loja_codigo: string; meta: number }[];
  vendas: Venda[];
  onSelectLoja: (lojaCodigo: string, lojaNome: string) => void;
  isLoading?: boolean;
}

/**
 * Ranking de lojas por performance em relação às metas
 * Cruza dados de metas com vendas realizadas
 */
export function MetasRanking({ metas, vendas, onSelectLoja, isLoading }: MetasRankingProps) {
  // Calcula o ranking cruzando metas com vendas
  const ranking: LojaRankingItem[] = useMemo(() => {
    if (!metas.length || !vendas.length) return [];

    // Criar map de vendas por código da loja
    const vendasMap = new Map<string, Venda>();
    vendas.forEach(v => vendasMap.set(v.codigo, v));

    // Calcular ranking
    const items: LojaRankingItem[] = metas
      .map(meta => {
        const venda = vendasMap.get(meta.loja_codigo);
        const vendaTotal = venda?.venda_total || 0;
        const percentual = meta.meta > 0 ? (vendaTotal / meta.meta) * 100 : 0;

        // Determinar status baseado no percentual do dia proporcional
        // Considerando que estamos em algum ponto do mês
        const hoje = new Date().getDate();
        const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const percentualEsperado = (hoje / diasNoMes) * 100;

        let status: PerformanceStatus = 'no_prazo';
        if (percentual >= percentualEsperado + 5) {
          status = 'adiantado';
        } else if (percentual < percentualEsperado - 5) {
          status = 'atrasado';
        }

        return {
          loja_codigo: meta.loja_codigo,
          loja_nome: venda?.loja || meta.loja_codigo,
          regional: venda?.regional || 'N/A',
          meta_total: meta.meta,
          vendas_realizadas: vendaTotal,
          percentual_atingido: percentual,
          status,
        };
      })
      .sort((a, b) => b.percentual_atingido - a.percentual_atingido);

    return items;
  }, [metas, vendas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusIcon = (status: PerformanceStatus) => {
    switch (status) {
      case 'adiantado':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'atrasado':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getProgressBarColor = (status: PerformanceStatus) => {
    switch (status) {
      case 'adiantado':
        return 'bg-green-500';
      case 'atrasado':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!ranking.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma meta encontrada</h3>
        <p className="text-sm text-gray-500">
          Verifique se existem metas cadastradas para este período.
        </p>
      </div>
    );
  }

  // Estatísticas resumidas
  const totalMeta = ranking.reduce((acc, item) => acc + item.meta_total, 0);
  const totalVendas = ranking.reduce((acc, item) => acc + item.vendas_realizadas, 0);
  const percentualGeral = totalMeta > 0 ? (totalVendas / totalMeta) * 100 : 0;
  const lojasAdiantadas = ranking.filter(r => r.status === 'adiantado').length;
  const lojasAtrasadas = ranking.filter(r => r.status === 'atrasado').length;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Meta Total</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(totalMeta)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Realizado</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(totalVendas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">% Atingido</p>
          <p className="text-lg font-bold text-primary-600">{percentualGeral.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Performance</p>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">{lojasAdiantadas}</span>
            <span className="text-gray-400">/</span>
            <span className="text-red-600 font-medium">{lojasAtrasadas}</span>
          </div>
        </div>
      </div>

      {/* Lista de Ranking */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Ranking de Lojas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Clique em uma loja para ver detalhes</p>
        </div>

        <div className="divide-y divide-gray-100">
          {ranking.map((item, index) => (
            <button
              key={item.loja_codigo}
              onClick={() => onSelectLoja(item.loja_codigo, item.loja_nome)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Posição */}
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                {index + 1}
              </div>

              {/* Info da Loja */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 truncate">{item.loja_nome}</span>
                  <span className="text-xs text-gray-400">({item.loja_codigo})</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500">{item.regional}</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-500">
                    Meta: {formatCurrency(item.meta_total)}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-32 hidden sm:block">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressBarColor(item.status)}`}
                    style={{ width: `${Math.min(item.percentual_atingido, 100)}%` }}
                  />
                </div>
              </div>

              {/* Percentual */}
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <span className={`font-bold ${
                    item.status === 'adiantado' ? 'text-green-600' :
                    item.status === 'atrasado' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {item.percentual_atingido.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(item.vendas_realizadas)}
                </p>
              </div>

              {/* Seta */}
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
