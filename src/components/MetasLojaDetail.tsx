import { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowLeft, Calendar, List, Store, Info, Loader2, Target, TrendingUp, Sparkles } from 'lucide-react';
import { MetasDistribuidaResponse, MetasViewMode, PacingData } from '../types/metas';
import { MetasPacingCard } from './MetasPacingCard';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetasLojaDetailProps {
  lojaCodigo: string;
  lojaNome: string;
  metasDistribuida: MetasDistribuidaResponse | undefined;
  vendasAcumuladas: number; // Vendas realizadas até hoje
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * Detalhe da loja com gráfico de sazonalidade e switcher calendário/lista
 */
export function MetasLojaDetail({
  lojaCodigo,
  lojaNome,
  metasDistribuida,
  vendasAcumuladas,
  onBack,
  isLoading
}: MetasLojaDetailProps) {
  const [viewMode, setViewMode] = useState<MetasViewMode>('calendario');
  const hoje = new Date().getDate();

  // Calcula dados de pacing com casting numérico
  const pacingData: PacingData = useMemo(() => {
    // Proteção contra dados não carregados
    if (!metasDistribuida?.dias) {
      return {
        metaAcumuladaHoje: 0,
        vendasRealizadasHoje: Number(vendasAcumuladas) || 0,
        diferenca: 0,
        percentualDiferenca: 0,
        status: 'no_prazo' as const,
      };
    }

    // Soma das metas até hoje (dia atual inclusive) com casting numérico
    const metaAcumuladaHoje = metasDistribuida.dias
      .filter(d => Number(d.dia) <= hoje)
      .reduce((acc, d) => acc + Number(d.meta_valor || 0), 0);

    const vendasNum = Number(vendasAcumuladas) || 0;
    const diferenca = vendasNum - metaAcumuladaHoje;
    const percentualDiferenca = metaAcumuladaHoje > 0
      ? (diferenca / metaAcumuladaHoje) * 100
      : 0;

    let status: 'adiantado' | 'atrasado' | 'no_prazo' = 'no_prazo';
    if (percentualDiferenca >= 5) {
      status = 'adiantado';
    } else if (percentualDiferenca < -5) {
      status = 'atrasado';
    }

    return {
      metaAcumuladaHoje,
      vendasRealizadasHoje: vendasNum,
      diferenca,
      percentualDiferenca,
      status,
    };
  }, [metasDistribuida, vendasAcumuladas, hoje]);

  // Calcula KPIs do cabeçalho com casting numérico
  const kpis = useMemo(() => {
    if (!metasDistribuida?.dias) return null;

    // 1. Meta Acumulada (Até hoje) - soma dos dias que já passaram
    const metaAcumuladaAteHoje = metasDistribuida.dias
      .filter(d => Number(d.dia) <= hoje)
      .reduce((acc, d) => acc + Number(d.meta_valor || 0), 0);

    // 2. Meta Total do Mês - com fallback se a API mandar 0
    const metaTotalApi = Number(metasDistribuida.total_meta_mes) || 0;
    const metaTotalCalculada = metasDistribuida.dias
      .reduce((acc, d) => acc + Number(d.meta_valor || 0), 0);

    const metaTotal = metaTotalApi > 0 ? metaTotalApi : metaTotalCalculada;

    // 3. Percentual do mês já passado
    const diasNoMes = metasDistribuida.dias.length || 30;
    const percentualMesPassado = (hoje / diasNoMes) * 100;

    // 4. Sazonalidade
    const sazonalidade = metasDistribuida.sazonalidade_usada || 'PADRAO';

    return {
      metaAcumuladaAteHoje,
      metaTotal,
      percentualMesPassado,
      sazonalidade,
      diasPassados: hoje,
      diasNoMes
    };
  }, [metasDistribuida, hoje]);

  // Dados do gráfico com casting numérico obrigatório
  const chartData = useMemo(() => {
    // Proteção contra crash - verifica se dados existem
    if (!metasDistribuida?.dias || metasDistribuida.dias.length === 0) {
      return null;
    }

    const labels = metasDistribuida.dias.map(d => `Dia ${Number(d.dia)}`);

    // Meta acumulada (sazonal) - CORREÇÃO: usar Number() para evitar concatenação de strings
    let acumuladoMeta = 0;
    const metaAcumulada = metasDistribuida.dias.map(d => {
      acumuladoMeta += Number(d.meta_valor || 0);
      return acumuladoMeta;
    });

    // Vendas reais acumuladas (simulação proporcional até hoje)
    const vendasNum = Number(vendasAcumuladas) || 0;
    const metaAcumuladaHojeNum = pacingData.metaAcumuladaHoje || 1;

    const vendasDiarias = metasDistribuida.dias.map((d, index) => {
      if (Number(d.dia) > hoje) return null; // Dias futuros não têm dados

      // Distribuição proporcional das vendas até hoje
      const proporcao = metaAcumulada[index] / metaAcumuladaHojeNum;
      return vendasNum * proporcao;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Meta Acumulada (Sazonal)',
          data: metaAcumulada,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
        },
        {
          label: 'Vendas Realizadas',
          data: vendasDiarias,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
          spanGaps: false,
        },
      ],
    };
  }, [metasDistribuida, vendasAcumuladas, hoje, pacingData.metaAcumuladaHoje]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) return '';
            return `${context.dataset.label || ''}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) => {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return `R$ ${(numValue / 1000).toFixed(0)}k`;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const formatCurrency = (value: number | string | undefined | null) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  // Estado de loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar para ranking"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Carregando dados da loja...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de dados não disponíveis
  if (!metasDistribuida?.dias) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar para ranking"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-800">{lojaNome}</h2>
              <span className="text-sm text-gray-400">({lojaCodigo})</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Dados não disponíveis</h3>
          <p className="text-sm text-gray-500">
            Não foi possível carregar os dados de metas para esta loja.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Voltar ao Ranking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Voltar para ranking"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-800">{lojaNome}</h2>
            <span className="text-sm text-gray-400">({lojaCodigo})</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dia {hoje} de {kpis?.diasNoMes || 30} ({kpis?.percentualMesPassado.toFixed(0) || 0}% do mês)
          </p>
        </div>

        {/* Switcher de Visualização */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('calendario')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendario'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Gráfico</span>
          </button>
          <button
            onClick={() => setViewMode('lista')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'lista'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Cards de KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Meta do Mês */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Meta do Mês</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.metaTotal)}</p>
            <p className="text-xs opacity-75 mt-1">Valor total a atingir</p>
          </div>

          {/* Card 2: Meta Esperada Até Hoje */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Meta Até Hoje</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.metaAcumuladaAteHoje)}</p>
            <p className="text-xs opacity-75 mt-1">
              Soma sazonal dos dias 1 a {hoje}
            </p>
          </div>

          {/* Card 3: Perfil de Sazonalidade */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Perfil Sazonal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                kpis.sazonalidade === 'PROPRIO'
                  ? 'bg-purple-100 text-purple-700'
                  : kpis.sazonalidade === 'REGIONAL'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {kpis.sazonalidade}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {kpis.sazonalidade === 'PROPRIO'
                ? 'Baseado no histórico desta loja'
                : kpis.sazonalidade === 'REGIONAL'
                ? 'Baseado na média da regional'
                : 'Distribuição uniforme padrão'
              }
            </p>
          </div>
        </div>
      )}

      {/* Card de Pacing */}
      <MetasPacingCard pacing={pacingData} />

      {/* Visualização baseada no modo */}
      {viewMode === 'calendario' ? (
        /* Gráfico de Sazonalidade */
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Meta Sazonal vs Vendas Realizadas</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Linha tracejada: meta acumulada | Linha sólida: vendas realizadas
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5" />
              <span>Dia atual: {hoje}</span>
            </div>
          </div>

          <div className="h-80">
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Dados insuficientes para gerar o gráfico</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Lista detalhada dia a dia */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Detalhamento Dia a Dia</h3>
            <p className="text-xs text-gray-500 mt-0.5">Meta sazonal distribuída por dia</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Dia</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Meta do Dia</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Peso</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Meta Acumulada</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metasDistribuida.dias.map((dia, index) => {
                  // Casting numérico para evitar concatenação de strings
                  const metaAcumulada = metasDistribuida.dias
                    .slice(0, index + 1)
                    .reduce((acc, d) => acc + Number(d.meta_valor || 0), 0);

                  const diaNum = Number(dia.dia);
                  const isHoje = diaNum === hoje;
                  const isPassado = diaNum < hoje;
                  const isFuturo = diaNum > hoje;

                  return (
                    <tr
                      key={diaNum}
                      className={`${isHoje ? 'bg-primary-50' : ''} ${isFuturo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isHoje ? 'text-primary-700' : 'text-gray-800'}`}>
                            {diaNum}
                          </span>
                          {isHoje && (
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-medium rounded">
                              HOJE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-gray-800">
                          {formatCurrency(dia.meta_valor)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm ${
                          Number(dia.peso_aplicado) > 1 ? 'text-green-600 font-medium' :
                          Number(dia.peso_aplicado) < 1 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {Number(dia.peso_aplicado || 0).toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-600">
                          {formatCurrency(metaAcumulada)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPassado && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Concluído
                          </span>
                        )}
                        {isHoje && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            Em Andamento
                          </span>
                        )}
                        {isFuturo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800" colSpan={3}>
                    {formatCurrency(metasDistribuida.total_meta_mes)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
