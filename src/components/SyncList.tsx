import { useState } from 'react';
import { Search, Wifi, WifiOff, AlertTriangle, Clock } from 'lucide-react';
import { Venda } from '../types/api';

interface SyncListProps {
  vendas: Venda[];
  isLoading?: boolean;
}

type SyncStatus = 'online' | 'warning' | 'offline';

interface SyncInfo {
  status: SyncStatus;
  label: string;
  minutesAgo: number;
}

export function SyncList({ vendas, isLoading }: SyncListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Parseia o tempo_ultimo_envio e retorna informações de status
  const parseSyncStatus = (tempo: string): SyncInfo => {
    // Formato esperado: "XXd XXh XXm XXs" ou variações
    const daysMatch = tempo.match(/(\d+)d/);
    const hoursMatch = tempo.match(/(\d+)h/);
    const minutesMatch = tempo.match(/(\d+)m/);

    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

    // Lógica de status:
    // Verde: < 1h (60 min)
    // Amarelo: >= 1h e < 24h
    // Vermelho: >= 24h ou dia anterior
    if (totalMinutes < 60) {
      return { status: 'online', label: tempo, minutesAgo: totalMinutes };
    } else if (totalMinutes < 24 * 60) {
      return { status: 'warning', label: tempo, minutesAgo: totalMinutes };
    } else {
      return { status: 'offline', label: tempo, minutesAgo: totalMinutes };
    }
  };

  // Ordena as vendas por maior atraso primeiro
  const vendasOrdenadas = [...vendas].sort((a, b) => {
    const statusA = parseSyncStatus(a.tempo_ultimo_envio);
    const statusB = parseSyncStatus(b.tempo_ultimo_envio);
    return statusB.minutesAgo - statusA.minutesAgo; // Maior atraso primeiro
  });

  // Filtra por busca
  const filteredVendas = vendasOrdenadas.filter((venda) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const codigo = venda.codigo.toLowerCase();
    const loja = venda.loja.toLowerCase();
    const regional = venda.regional.toLowerCase();

    return codigo.includes(term) || loja.includes(term) || regional.includes(term);
  });

  // Conta status para resumo
  const statusCounts = vendasOrdenadas.reduce(
    (acc, venda) => {
      const { status } = parseSyncStatus(venda.tempo_ultimo_envio);
      acc[status]++;
      return acc;
    },
    { online: 0, warning: 0, offline: 0 }
  );

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SyncStatus) => {
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'offline':
        return `${baseClasses} bg-red-100 text-red-700`;
    }
  };

  const getStatusLabel = (status: SyncStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'warning':
        return 'Atenção';
      case 'offline':
        return 'Offline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vendas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhuma loja encontrada para monitoramento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo de Status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Online</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{statusCounts.online}</p>
          <p className="text-[10px] text-green-600">&lt; 1 hora</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">Atenção</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{statusCounts.warning}</p>
          <p className="text-[10px] text-yellow-600">&gt; 1 hora</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Offline</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{statusCounts.offline}</p>
          <p className="text-[10px] text-red-600">&gt; 24 horas</p>
        </div>
      </div>

      {/* Campo de Pesquisa */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, loja ou regional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500">
            {filteredVendas.length} {filteredVendas.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
          </p>
        )}
      </div>

      {/* Lista de Lojas */}
      {filteredVendas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma loja encontrada com "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Limpar pesquisa
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVendas.map((venda) => {
            const syncInfo = parseSyncStatus(venda.tempo_ultimo_envio);

            return (
              <div
                key={venda.codigo}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {/* Ícone de Status */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      syncInfo.status === 'online'
                        ? 'bg-green-100'
                        : syncInfo.status === 'warning'
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {getStatusIcon(syncInfo.status)}
                  </div>

                  {/* Informações da Loja */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{venda.loja}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {venda.codigo} • {venda.regional}
                    </p>
                  </div>

                  {/* Status e Tempo */}
                  <div className="text-right flex-shrink-0">
                    <span className={getStatusBadge(syncInfo.status)}>
                      {getStatusLabel(syncInfo.status)}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{syncInfo.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legenda */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-600 font-medium mb-2">Legenda de Status:</p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Online: último envio &lt; 1h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Atenção: último envio &gt; 1h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Offline: último envio &gt; 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
