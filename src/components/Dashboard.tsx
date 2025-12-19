import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { RefreshCw, AlertCircle, ArrowUpDown, Eye, List } from 'lucide-react';
import { DateNavigator } from './DateNavigator';
import { VendasList } from './VendasList';
import { useVendas } from '../hooks/useVendas';
import { ViewMode } from '../types/api';

type SortField = 'venda_total' | 'total_quantidade' | 'numero_vendas' | 'ticket_medio' | 'cmv';
type SortOrder = 'asc' | 'desc';

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [sortField, setSortField] = useState<SortField>('venda_total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

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

  const getParams = () => {
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
      cmv: '%CMV'
    };

    const direction = sortOrder === 'desc' ? 'Maior→Menor' : 'Menor→Maior';
    return `Ordenação: ${fieldNames[sortField]} (${direction})`;
  };

  const { data, isLoading, error, refetch, isFetching } = useVendas(getParams());

  useEffect(() => {
    refetch();
  }, [currentDate, viewMode, refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-primary-100 text-xs mt-1">{getSortDescription()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isCompactMode
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isCompactMode ? "Ver Detalhes" : "Modo Compacto"}
                aria-label="Alternar modo de visualização"
              >
                {isCompactMode ? <Eye className="w-5 h-5" /> : <List className="w-5 h-5" />}
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

              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                aria-label="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <DateNavigator
          currentDate={currentDate}
          viewMode={viewMode}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
        />

        {data && (
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="text-gray-600">
              <span className="font-medium">{data.total_registros}</span> lojas encontradas
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  data.fonte === 'cache' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              />
              <span className="text-gray-500 text-xs">
                {data.fonte === 'cache' ? 'Cache' : 'Database'}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar dados</h3>
                <p className="text-sm text-red-600">
                  {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        <VendasList
          vendas={data?.vendas || []}
          isLoading={isLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          isCompactMode={isCompactMode}
        />

        {data && (
          <div className="mt-6 text-center text-xs text-gray-500">
            Última atualização: {new Date(data.data_consulta).toLocaleString('pt-BR')}
          </div>
        )}
      </main>
    </div>
  );
}
