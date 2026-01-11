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
import { ArrowLeft, Calendar, List, Store, Info, Loader2, Target, TrendingUp, Sparkles, Zap, Radio } from 'lucide-react';
import { MetasDistribuidaResponse, MetasViewMode, PacingData, DadoCombinado, TipoDado } from '../types/metas';
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
  vendaRealizadaDia: number;       // Venda exclusiva de HOJE (realtime) - NÃO usar projeção do backend
  vendaRealizadaAcumulada: number; // Venda total do mês até agora (1º até hoje)
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * Detalhe da loja com gráfico de sazonalidade e switcher calendário/lista (V3.0)
 *
 * Exibe duas análises distintas:
 * 1. "Hoje" (Curto Prazo): Meta do Dia vs Venda Real vs Projeção Estatística
 * 2. "Ritmo" (Longo Prazo): Meta Acumulada vs Venda Acumulada
 *
 * Fusão de Dados V3.0:
 * - Dias passados: d.venda do endpoint /metas/distribuida (histórico)
 * - Dia atual: vendaRealizadaDia (realtime) - IGNORA projeção do backend
 * - Dias futuros: d.venda do endpoint /metas/distribuida (projeção estatística)
 */
export function MetasLojaDetail({
  lojaCodigo,
  lojaNome,
  metasDistribuida,
  vendaRealizadaDia,
  vendaRealizadaAcumulada,
  onBack,
  isLoading
}: MetasLojaDetailProps) {
  const [viewMode, setViewMode] = useState<MetasViewMode>('lista'); // Padrão: tabela

  // SEMPRE usa a data atual do sistema (independente da data que o usuário está visualizando)
  // A análise de metas é sempre até o dia ATUAL, não muda com a navegação do usuário
  const hoje = new Date().getDate();

  // ===== DATA FUSION V3.0: Combina Histórico + Realtime + Projeção =====
  const dadosCombinados: DadoCombinado[] = useMemo(() => {
    if (!metasDistribuida?.dias) return [];

    return metasDistribuida.dias.map(meta => {
      const diaNum = Number(meta.dia);
      const metaValor = Number(meta.meta_valor) || 0;
      const vendaBackend = Number(meta.venda) || 0; // V3.0: vem do endpoint unificado

      // Lógica de fusão V3.0:
      // - Passado: usa d.venda (histórico real)
      // - Hoje: usa vendaRealizadaDia (realtime) - IGNORA projeção do backend
      // - Futuro: usa d.venda (projeção estatística)
      let vendaValor: number;
      let tipo: TipoDado;

      if (diaNum < hoje) {
        // Dias passados: histórico do backend
        vendaValor = vendaBackend;
        tipo = 'historico';
      } else if (diaNum === hoje) {
        // Hoje: sempre usa realtime (ignora projeção)
        vendaValor = Number(vendaRealizadaDia) || 0;
        tipo = 'realtime';
      } else {
        // Futuro: projeção estatística do backend
        vendaValor = vendaBackend;
        tipo = 'projecao';
      }

      const diferenca = vendaValor - metaValor;

      return {
        dia: diaNum,
        meta_valor: metaValor,
        peso_aplicado: Number(meta.peso_aplicado) || 0,
        venda_realizada: vendaValor,
        projecao_estatistica: vendaBackend, // Sempre guarda a projeção para comparativo
        diferenca,
        tipo,
        exibir_venda: diaNum <= hoje // Só exibe venda real se o dia já passou ou é hoje
      };
    });
  }, [metasDistribuida, vendaRealizadaDia, hoje]);

  // ===== ANÁLISE 1: Desempenho de HOJE (Curto Prazo) =====
  // Compara: Meta vs Venda Real vs Projeção Estatística
  const performanceHoje = useMemo(() => {
    if (!metasDistribuida?.dias) return null;

    // Encontra a meta específica do dia atual
    const diaAtual = metasDistribuida.dias.find(d => Number(d.dia) === hoje);
    const metaHoje = Number(diaAtual?.meta_valor || 0);
    const projecaoHoje = Number(diaAtual?.venda || 0); // Projeção estatística do backend
    const vendaHoje = Number(vendaRealizadaDia) || 0;  // Valor REAL (realtime)
    const delta = vendaHoje - metaHoje;
    const percentual = metaHoje > 0 ? (delta / metaHoje) * 100 : 0;

    // Comparação com projeção: estamos acima ou abaixo do esperado estatisticamente?
    const deltaVsProjecao = vendaHoje - projecaoHoje;
    const percentualVsProjecao = projecaoHoje > 0 ? (deltaVsProjecao / projecaoHoje) * 100 : 0;

    // Status do dia (baseado na meta)
    let status: 'acima' | 'abaixo' | 'neutro' = 'neutro';
    if (percentual >= 5) {
      status = 'acima';
    } else if (percentual < -5) {
      status = 'abaixo';
    }

    return {
      meta: metaHoje,
      projecao: projecaoHoje,       // V3.0: projeção estatística
      realizado: vendaHoje,          // Valor real (realtime)
      delta,
      percentual,
      deltaVsProjecao,               // V3.0: diferença Real vs Projeção
      percentualVsProjecao,          // V3.0: % Real vs Projeção
      status
    };
  }, [metasDistribuida, vendaRealizadaDia, hoje]);

  // ===== ANÁLISE 2: Pacing MENSAL (Longo Prazo) =====
  const pacingData: PacingData = useMemo(() => {
    // Proteção contra dados não carregados
    if (!metasDistribuida?.dias) {
      return {
        metaAcumuladaHoje: 0,
        vendasRealizadasHoje: Number(vendaRealizadaAcumulada) || 0,
        diferenca: 0,
        percentualDiferenca: 0,
        status: 'no_prazo' as const,
      };
    }

    // Soma das metas até hoje (dia atual inclusive) com casting numérico
    const metaAcumuladaHoje = metasDistribuida.dias
      .filter(d => Number(d.dia) <= hoje)
      .reduce((acc, d) => acc + Number(d.meta_valor || 0), 0);

    // Calcula vendas acumuladas usando dados combinados (mais preciso)
    const vendasAcumuladas = dadosCombinados
      .filter(d => d.exibir_venda)
      .reduce((acc, d) => acc + d.venda_realizada, 0);

    // Fallback para vendaRealizadaAcumulada se dadosCombinados estiver vazio
    const vendasFinal = vendasAcumuladas > 0 ? vendasAcumuladas : Number(vendaRealizadaAcumulada) || 0;

    const diferenca = vendasFinal - metaAcumuladaHoje;
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
      vendasRealizadasHoje: vendasFinal,
      diferenca,
      percentualDiferenca,
      status,
    };
  }, [metasDistribuida, vendaRealizadaAcumulada, hoje, dadosCombinados]);

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

    // 3. Percentual do mês já passado (baseado na SOMA DOS PESOS, não simples contagem de dias)
    const diasNoMes = metasDistribuida.dias.length || 30;

    const pesoAcumuladoHoje = metasDistribuida.dias
      .filter(d => Number(d.dia) <= hoje)
      .reduce((acc, d) => acc + Number(d.peso_aplicado || 0), 0);

    const pesoTotal = metasDistribuida.dias
      .reduce((acc, d) => acc + Number(d.peso_aplicado || 0), 0);

    // Percentual baseado em pesos (ex: se fins de semana têm peso maior, eles contam mais)
    const percentualMesPassado = pesoTotal > 0 ? (pesoAcumuladoHoje / pesoTotal) * 100 : 0;

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

  // Dados do gráfico usando dados combinados reais + projeção
  const chartData = useMemo(() => {
    // Proteção contra crash - verifica se dados existem
    if (!metasDistribuida?.dias || metasDistribuida.dias.length === 0) {
      return null;
    }

    const labels = dadosCombinados.map(d => `Dia ${d.dia}`);

    // Meta acumulada (sazonal)
    let acumuladoMeta = 0;
    const metaAcumulada = dadosCombinados.map(d => {
      acumuladoMeta += d.meta_valor;
      return acumuladoMeta;
    });

    // Vendas reais acumuladas (histórico + realtime até hoje)
    let acumuladoVendas = 0;
    const vendasReaisAcumuladas = dadosCombinados.map(d => {
      if (d.tipo === 'projecao') return null; // Para em hoje
      acumuladoVendas += d.venda_realizada;
      return acumuladoVendas;
    });

    // Projeção acumulada (começa de hoje e vai até o fim do mês)
    let acumuladoProjecao = 0;
    const projecaoAcumulada = dadosCombinados.map(d => {
      acumuladoProjecao += d.venda_realizada; // Usa venda_realizada que já tem a fusão
      if (d.dia < hoje) return null; // Só mostra a partir de hoje
      return acumuladoProjecao;
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
          label: 'Realizado (Histórico + Hoje)',
          data: vendasReaisAcumuladas,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
          spanGaps: false,
        },
        {
          label: 'Projeção (Futuro)',
          data: projecaoAcumulada,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          borderDash: [3, 3],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          spanGaps: true,
        },
      ],
    };
  }, [metasDistribuida, dadosCombinados, hoje]);

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

  // Calcula totais para o footer da tabela (DEVE ficar ANTES dos early returns)
  // Inclui projeção para mostrar previsão de fechamento do mês
  const totais = useMemo(() => {
    const totalMeta = dadosCombinados.reduce((acc, d) => acc + d.meta_valor, 0);

    // Total realizado até hoje (só histórico + realtime)
    const totalRealizadoAteHoje = dadosCombinados
      .filter(d => d.tipo !== 'projecao')
      .reduce((acc, d) => acc + d.venda_realizada, 0);

    // Previsão de fechamento = Realizado até hoje + Projeção futura
    const totalProjetado = dadosCombinados.reduce((acc, d) => acc + d.venda_realizada, 0);

    // Diferença baseada na previsão de fechamento
    const totalDiferenca = totalProjetado - totalMeta;

    return {
      totalMeta,
      totalRealizadoAteHoje,  // Para referência
      totalProjetado,          // Previsão de fechamento (histórico + realtime + projeção)
      totalDiferenca
    };
  }, [dadosCombinados]);

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

      {/* ===== CARD DE DESTAQUE V3.0: Desempenho de HOJE ===== */}
      {performanceHoje && (
        <div className={`rounded-xl p-4 sm:p-5 shadow-lg border-2 ${
          performanceHoje.status === 'acima'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : performanceHoje.status === 'abaixo'
            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${
                performanceHoje.status === 'acima' ? 'text-green-600' :
                performanceHoje.status === 'abaixo' ? 'text-red-600' : 'text-gray-600'
              }`} />
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
                Hoje (Dia {hoje})
              </h3>
            </div>
            {/* Badge LIVE - indica dado em tempo real */}
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full animate-pulse">
              <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              LIVE
            </span>
          </div>

          {/* Grid responsivo: 2 colunas no mobile, 4 no desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Meta do Dia */}
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Meta</p>
              <p className="text-sm sm:text-lg font-bold text-gray-800">{formatCurrency(performanceHoje.meta)}</p>
            </div>

            {/* Venda Real do Dia */}
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Real</p>
              <p className={`text-sm sm:text-lg font-bold ${
                performanceHoje.status === 'acima' ? 'text-green-600' :
                performanceHoje.status === 'abaixo' ? 'text-red-600' : 'text-gray-800'
              }`}>
                {formatCurrency(performanceHoje.realizado)}
              </p>
            </div>

            {/* Delta vs Meta */}
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">vs Meta</p>
              <p className={`text-sm sm:text-lg font-bold ${
                performanceHoje.delta >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {performanceHoje.delta >= 0 ? '+' : ''}{formatCurrency(performanceHoje.delta)}
              </p>
              <span className={`text-[9px] sm:text-xs font-medium ${
                performanceHoje.delta >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ({performanceHoje.percentual >= 0 ? '+' : ''}{performanceHoje.percentual.toFixed(1)}%)
              </span>
            </div>

            {/* Projeção */}
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Projeção</p>
              <p className="text-sm sm:text-lg font-bold text-purple-600">{formatCurrency(performanceHoje.projecao)}</p>
              <span className={`text-[9px] sm:text-xs font-medium ${
                performanceHoje.deltaVsProjecao >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ({performanceHoje.percentualVsProjecao >= 0 ? '+' : ''}{performanceHoje.percentualVsProjecao.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cards de KPIs - Metas do Mês */}
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

          {/* Card 3: Inteligência da Meta */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Inteligência da Meta</span>
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

      {/* Card de Pacing MENSAL (Ritmo do Mês) */}
      <MetasPacingCard pacing={pacingData} />

      {/* Visualização baseada no modo */}
      {viewMode === 'calendario' ? (
        /* Gráfico de Sazonalidade */
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Meta Sazonal vs Vendas Reais</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Linha tracejada: meta acumulada | Linha sólida: vendas reais acumuladas
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
        /* Lista detalhada dia a dia com dados reais */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Detalhamento Dia a Dia</h3>
            <p className="text-xs text-gray-500 mt-0.5">Meta sazonal e vendas reais por dia</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Dia</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Meta</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Realizado</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Diferença</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Peso</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dadosCombinados.map((dado) => {
                  const isHoje = dado.dia === hoje;
                  const isPassado = dado.dia < hoje;
                  const isFuturo = dado.dia > hoje;

                  return (
                    <tr
                      key={dado.dia}
                      className={`${isHoje ? 'bg-primary-50' : ''} ${isFuturo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isHoje ? 'text-primary-700' : 'text-gray-800'}`}>
                            {dado.dia}
                          </span>
                          {isHoje && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded animate-pulse">
                              <Radio className="w-2.5 h-2.5" />
                              LIVE
                            </span>
                          )}
                          {dado.tipo === 'historico' && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                              Histórico
                            </span>
                          )}
                          {dado.tipo === 'projecao' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-medium rounded">
                              Projeção
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-medium text-gray-800">
                          {formatCurrency(dado.meta_valor)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-medium ${
                          dado.tipo === 'projecao'
                            ? 'text-purple-600'
                            : dado.diferenca >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dado.venda_realizada)}
                        </span>
                        {/* Mostrar projeção para o dia de hoje */}
                        {isHoje && (
                          <span className="block text-[10px] text-purple-500">
                            Proj: {formatCurrency(dado.projecao_estatistica)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-medium ${
                          dado.tipo === 'projecao'
                            ? 'text-purple-600'
                            : dado.diferenca >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dado.diferenca >= 0 ? '+' : ''}{formatCurrency(dado.diferenca)}
                        </span>
                        {/* Mostrar diferença vs projeção para hoje */}
                        {isHoje && (
                          <span className={`block text-[10px] ${
                            dado.venda_realizada >= dado.projecao_estatistica ? 'text-green-500' : 'text-red-500'
                          }`}>
                            vs Proj: {dado.venda_realizada >= dado.projecao_estatistica ? '+' : ''}
                            {formatCurrency(dado.venda_realizada - dado.projecao_estatistica)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`text-sm ${
                          dado.peso_aplicado > 1 ? 'text-green-600 font-medium' :
                          dado.peso_aplicado < 1 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {dado.peso_aplicado.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {isPassado && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            dado.diferenca >= 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {dado.diferenca >= 0 ? 'Atingido' : 'Abaixo'}
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
                  <td className="px-3 py-3">
                    <span className="font-semibold text-gray-700">Previsão</span>
                    <span className="block text-[10px] text-gray-400">Realizado + Projeção</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-gray-800">
                    {formatCurrency(totais.totalMeta)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-bold text-purple-600">{formatCurrency(totais.totalProjetado)}</span>
                    <span className="block text-[10px] text-gray-400">
                      Até hoje: {formatCurrency(totais.totalRealizadoAteHoje)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold">
                    <span className={totais.totalDiferenca >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {totais.totalDiferenca >= 0 ? '+' : ''}{formatCurrency(totais.totalDiferenca)}
                    </span>
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
