import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { DateNavigator } from './DateNavigator';
import { VendasList } from './VendasList';
import { useVendas } from '../hooks/useVendas';
import { ViewMode } from '../types/api';

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

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
              <h1 className="text-2xl font-bold text-white">Dashboard de Vendas</h1>
              <p className="text-primary-100 text-sm mt-1">Real Time</p>
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

        <VendasList vendas={data?.vendas || []} isLoading={isLoading} />

        {data && (
          <div className="mt-6 text-center text-xs text-gray-500">
            Última atualização: {new Date(data.data_consulta).toLocaleString('pt-BR')}
          </div>
        )}
      </main>
    </div>
  );
}
