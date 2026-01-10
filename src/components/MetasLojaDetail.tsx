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
import { ArrowLeft, Calendar, List, Store, Info } from 'lucide-react';
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

  // Calcula dados de pacing
  const pacingData: PacingData = useMemo(() => {
    if (!metasDistribuida) {
      return {
        metaAcumuladaHoje: 0,
        vendasRealizadasHoje: vendasAcumuladas,
        diferenca: 0,
        percentualDiferenca: 0,
        status: 'no_prazo' as const,
      };
    }

    // Soma das metas até hoje (dia atual inclusive)
    const metaAcumuladaHoje = metasDistribuida.dias
      .filter(d => d.dia <= hoje)
      .reduce((acc, d) => acc + d.meta_valor, 0);

    const diferenca = vendasAcumuladas - metaAcumuladaHoje;
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
      vendasRealizadasHoje: vendasAcumuladas,
      diferenca,
      percentualDiferenca,
      status,
    };
  }, [metasDistribuida, vendasAcumuladas, hoje]);

  // Dados do gráfico
  const chartData = useMemo(() => {
    if (!metasDistribuida) return null;

    const labels = metasDistribuida.dias.map(d => `Dia ${d.dia}`);

    // Meta acumulada (sazonal)
    let acumuladoMeta = 0;
    const metaAcumulada = metasDistribuida.dias.map(d => {
      acumuladoMeta += d.meta_valor;
      return acumuladoMeta;
    });

    // Vendas reais acumuladas (simulação proporcional até hoje)
    // Na prática, você teria dados dia a dia do backend
    const vendasDiarias = metasDistribuida.dias.map((d, index) => {
      if (d.dia > hoje) return null; // Dias futuros não têm dados

      // Distribuição proporcional das vendas até hoje
      const proporcao = metaAcumulada[index] / (pacingData.metaAcumuladaHoje || 1);
      return vendasAcumuladas * proporcao;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
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
          {metasDistribuida && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                Sazonalidade: {metasDistribuida.sazonalidade_usada}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                Meta Total: {formatCurrency(metasDistribuida.total_meta_mes)}
              </span>
            </div>
          )}
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
            {chartData && <Line data={chartData} options={chartOptions} />}
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
                {metasDistribuida?.dias.map((dia, index) => {
                  const metaAcumulada = metasDistribuida.dias
                    .slice(0, index + 1)
                    .reduce((acc, d) => acc + d.meta_valor, 0);

                  const isHoje = dia.dia === hoje;
                  const isPassado = dia.dia < hoje;
                  const isFuturo = dia.dia > hoje;

                  return (
                    <tr
                      key={dia.dia}
                      className={`${isHoje ? 'bg-primary-50' : ''} ${isFuturo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isHoje ? 'text-primary-700' : 'text-gray-800'}`}>
                            {dia.dia}
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
                          dia.peso_aplicado > 1 ? 'text-green-600 font-medium' :
                          dia.peso_aplicado < 1 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {dia.peso_aplicado.toFixed(2)}x
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
                    {metasDistribuida && formatCurrency(metasDistribuida.total_meta_mes)}
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
