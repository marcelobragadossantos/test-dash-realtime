import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  LayoutGrid,
  AlignJustify,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react';
import { DateNavigator } from './DateNavigator';
import { VendasList } from './VendasList';
import { SyncList } from './SyncList';
import { useVendas } from '../hooks/useVendas';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { usePortalGatewayUser } from '../hooks/usePortalGatewayUser';
import { ViewMode } from '../types/api';

// Configuração: tempo mínimo de loading em milissegundos (5 segundos)
const MIN_LOADING_TIME = 5000;

type SortField = 'venda_total' | 'total_quantidade' | 'numero_vendas' | 'ticket_medio' | 'cmv' | 'margem';
type SortOrder = 'asc' | 'desc';
type ActiveTab = 'indicadores' | 'monitor';

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [sortField, setSortField] = useState<SortField>('venda_total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('indicadores');
  const [isMinLoadingFinished, setIsMinLoadingFinished] = useState(false);
  const [loadingStartTime] = useState(() => Date.now());
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Portal Gateway - dados do usuário
  const portalUser = usePortalGatewayUser();
  const welcomeMessage = portalUser?.userName
    ? `Bem vindo ${portalUser.userName}`
    : 'Bem vindo Visitante';

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  // Timer para tempo mínimo de loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinLoadingFinished(true);
    }, MIN_LOADING_TIME);

    return () => clearTimeout(timer);
  }, []);

  // Parâmetros para query de Indicadores (baseado no filtro selecionado)
  const getIndicadoresParams = () => {
    if (viewMode === 'day') {
      return {
        data: format(currentDate, 'yyyy-MM-dd'),
      };
    } else {
      return {
        data_inicio: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        data_fim: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
      };
    }
  };

  const getSortDescription = () => {
    const fieldNames: Record<SortField, string> = {
      venda_total: 'Total Vendas',
      total_quantidade: 'Quantidade',
      numero_vendas: 'Nº Clientes',
      ticket_medio: 'Ticket Médio',
      cmv: '%CMV',
      margem: '%Margem'
    };

    const direction = sortOrder === 'desc' ? 'Maior→Menor' : 'Menor→Maior';
    return `Ordenação: ${fieldNames[sortField]} (${direction})`;
  };

  // Query para Indicadores (aba principal)
  const queryIndicadores = useVendas(getIndicadoresParams());

  // Query para Monitor de Sincronização (endpoint dedicado /sync-status)
  const querySyncStatus = useSyncStatus();

  // Refetch quando muda data ou viewMode
  useEffect(() => {
    queryIndicadores.refetch();
  }, [currentDate, viewMode]);

  // Verifica se está em loading inicial (considera ambas as queries e o tempo mínimo)
  const isInitialLoading = !isMinLoadingFinished || queryIndicadores.isLoading || querySyncStatus.isLoading;

  // Calcula o progresso visual do loading (para feedback)
  const [loadingProgress, setLoadingProgress] = useState(0);
  useEffect(() => {
    if (isInitialLoading) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - loadingStartTime;
        const progress = Math.min((elapsed / MIN_LOADING_TIME) * 100, 100);
        setLoadingProgress(progress);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isInitialLoading, loadingStartTime]);

  // Handler para atualizar dados - chama apenas a query da aba ativa
  const handleRefresh = () => {
    if (activeTab === 'indicadores') {
      queryIndicadores.refetch();
    } else {
      querySyncStatus.refetch();
    }
  };

  // Verifica se está carregando (baseado na aba ativa)
  const isRefreshing = activeTab === 'indicadores'
    ? queryIndicadores.isFetching
    : querySyncStatus.isFetching;

  // Splash Screen / Loading Screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
        <div className="text-center px-6">
          {/* Logo / Ícone */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard de Vendas</h1>
          <p className="text-white text-lg mb-1">{welcomeMessage}</p>
          <p className="text-primary-200 mb-8">Sincronizando dados das lojas...</p>

          {/* Spinner */}
          <div className="mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
          </div>

          {/* Barra de Progresso */}
          <div className="w-64 mx-auto">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-primary-200 mt-2">
              {loadingProgress < 100 ? 'Carregando...' : 'Finalizando...'}
            </p>
          </div>

          {/* Indicadores de status das queries */}
          <div className="mt-8 flex justify-center gap-4 text-xs text-primary-200">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                queryIndicadores.isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              }`} />
              <span>Indicadores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                querySyncStatus.isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              }`} />
              <span>Monitor</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              {activeTab === 'indicadores' && queryIndicadores.data && (
                <p className="text-primary-200 text-[10px] opacity-80">
                  Última atualização: {new Date(queryIndicadores.data.data_consulta).toLocaleString('pt-BR')}
                </p>
              )}
              {activeTab === 'monitor' && querySyncStatus.data && (
                <p className="text-primary-200 text-[10px] opacity-80">
                  Última atualização: {new Date(querySyncStatus.data.data_consulta).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Botões de ação só aparecem na aba Indicadores */}
              {activeTab === 'indicadores' && (
                <>
                  <button
                    onClick={() => setIsCompactMode(!isCompactMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      isCompactMode
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-primary-500 text-white shadow-sm'
                    }`}
                    title={isCompactMode ? "Modo Detalhado" : "Modo Compacto"}
                    aria-label="Alternar modo de visualização"
                  >
                    {isCompactMode ? <AlignJustify className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                  </button>

                  <div className="relative" ref={sortMenuRef}>
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                      aria-label="Ordenar"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                      <span className="hidden sm:inline">Ordenar</span>
                    </button>

                    {showSortMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 py-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                          Ordenar por
                        </div>
                        {[
                          { value: 'venda_total', label: 'Total Vendas' },
                          { value: 'total_quantidade', label: 'Quantidade' },
                          { value: 'numero_vendas', label: 'Nº Clientes' },
                          { value: 'cmv', label: '%CMV' },
                          { value: 'margem', label: '%Margem' },
                          { value: 'ticket_medio', label: 'Ticket Médio' },
                        ].map((field) => (
                          <button
                            key={field.value}
                            onClick={() => {
                              setSortField(field.value as SortField);
                              setShowSortMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                              sortField === field.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {field.label}
                          </button>
                        ))}
                        <div className="border-t mt-2 pt-2 px-3 pb-1">
                          <div className="text-xs font-semibold text-gray-500 mb-1">Direção</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSortOrder('desc')}
                              className={`flex-1 px-3 py-1.5 text-xs rounded ${
                                sortOrder === 'desc'
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Maior → Menor
                            </button>
                            <button
                              onClick={() => setSortOrder('asc')}
                              className={`flex-1 px-3 py-1.5 text-xs rounded ${
                                sortOrder === 'asc'
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Menor → Maior
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                aria-label="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>
          {activeTab === 'indicadores' && (
            <p className="text-primary-200 text-[10px] text-right mt-1 opacity-80">{getSortDescription()}</p>
          )}
        </div>

        {/* Tabs de Navegação */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex border-b border-primary-500/30">
            <button
              onClick={() => setActiveTab('indicadores')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'indicadores'
                  ? 'text-white'
                  : 'text-primary-200 hover:text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline">Indicadores</span>
              {activeTab === 'indicadores' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'monitor'
                  ? 'text-white'
                  : 'text-primary-200 hover:text-white'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="hidden sm:inline">Monitor</span>
              {activeTab === 'monitor' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Conteúdo da Aba Indicadores */}
        {activeTab === 'indicadores' && (
          <>
            <DateNavigator
              currentDate={currentDate}
              viewMode={viewMode}
              onDateChange={setCurrentDate}
              onViewModeChange={setViewMode}
            />

            {queryIndicadores.data && (
              <div className="mb-4 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{queryIndicadores.data.total_registros}</span> lojas encontradas
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      queryIndicadores.data.fonte === 'cache' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="text-gray-500 text-xs">
                    {queryIndicadores.data.fonte === 'cache' ? 'Cache' : 'Database'}
                  </span>
                </div>
              </div>
            )}

            {queryIndicadores.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar dados</h3>
                    <p className="text-sm text-red-600">
                      {queryIndicadores.error instanceof Error ? queryIndicadores.error.message : 'Ocorreu um erro desconhecido'}
                    </p>
                    <button
                      onClick={() => queryIndicadores.refetch()}
                      className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            <VendasList
              vendas={queryIndicadores.data?.vendas || []}
              isLoading={queryIndicadores.isFetching && !queryIndicadores.data}
              sortField={sortField}
              sortOrder={sortOrder}
              isCompactMode={isCompactMode}
            />
          </>
        )}

        {/* Conteúdo da Aba Monitor */}
        {activeTab === 'monitor' && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Monitor de Sincronização</h2>
              <p className="text-sm text-gray-500">
                Status de conexão das lojas em tempo real
              </p>
            </div>

            {querySyncStatus.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar dados do monitor</h3>
                    <p className="text-sm text-red-600">
                      {querySyncStatus.error instanceof Error ? querySyncStatus.error.message : 'Ocorreu um erro desconhecido'}
                    </p>
                    <button
                      onClick={() => querySyncStatus.refetch()}
                      className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            <SyncList
              lojas={querySyncStatus.data?.lojas || []}
              isLoading={querySyncStatus.isFetching && !querySyncStatus.data}
            />
          </>
        )}
      </main>
    </div>
  );
}
