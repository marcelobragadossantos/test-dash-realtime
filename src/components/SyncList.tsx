import { useState } from 'react';
import { Search, Wifi, WifiOff, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { LojaSync } from '../types/api';

interface SyncListProps {
  lojas: LojaSync[];
  isLoading?: boolean;
}

type SyncStatus = 'online' | 'warning' | 'offline' | 'unknown';

interface SyncInfo {
  status: SyncStatus;
  label: string;
  minutesAgo: number;
}

export function SyncList({ lojas, isLoading }: SyncListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Parseia o tempo_ultimo_envio e retorna informações de status
  // Formatos suportados: "XXd XXh XXm XXs" ou "HH:MM:SS" ou null
  const parseSyncStatus = (tempo: string | null): SyncInfo => {
    // Se não há tempo, considera como offline/desconhecido
    if (!tempo) {
      return { status: 'unknown', label: 'Sem dados', minutesAgo: Infinity };
    }

    let totalMinutes = 0;

    // Formato 1: "XXd XXh XXm XXs" (ex: "00d 00h 00m 27s")
    const daysMatch = tempo.match(/(\d+)d/);
    const hoursMatch = tempo.match(/(\d+)h/);
    const minutesMatch = tempo.match(/(\d+)m/);

    if (daysMatch || hoursMatch || minutesMatch) {
      const days = daysMatch ? parseInt(daysMatch[1]) : 0;
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    } else {
      // Formato 2: "HH:MM:SS"
      const parts = tempo.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        totalMinutes = hours * 60 + minutes;
      } else {
        return { status: 'unknown', label: tempo, minutesAgo: Infinity };
      }
    }

    // Lógica de status:
    // Verde: < 1h (60 min)
    // Amarelo: >= 1h e < 24h
    // Vermelho: >= 24h
    if (totalMinutes < 60) {
      return { status: 'online', label: tempo, minutesAgo: totalMinutes };
    } else if (totalMinutes < 24 * 60) {
      return { status: 'warning', label: tempo, minutesAgo: totalMinutes };
    } else {
      return { status: 'offline', label: tempo, minutesAgo: totalMinutes };
    }
  };

  // Ordena as lojas por maior atraso primeiro
  const lojasOrdenadas = [...lojas].sort((a, b) => {
    const statusA = parseSyncStatus(a.tempo_ultimo_envio);
    const statusB = parseSyncStatus(b.tempo_ultimo_envio);
    return statusB.minutesAgo - statusA.minutesAgo; // Maior atraso primeiro
  });

  // Filtra por busca
  const filteredLojas = lojasOrdenadas.filter((loja) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const codigo = loja.codigo.toLowerCase();
    const nome = loja.loja.toLowerCase();
    const regional = loja.regional.toLowerCase();

    return codigo.includes(term) || nome.includes(term) || regional.includes(term);
  });

  // Conta status para resumo
  const statusCounts = lojasOrdenadas.reduce(
    (acc, loja) => {
      const { status } = parseSyncStatus(loja.tempo_ultimo_envio);
      if (status === 'unknown') {
        acc.offline++;
      } else {
        acc[status]++;
      }
      return acc;
    },
    { online: 0, warning: 0, offline: 0 }
  );

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline':
      case 'unknown':
        return <WifiOff className="w-4 h-4 text-red-600" />;
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

  if (lojas.length === 0) {
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
            {filteredLojas.length} {filteredLojas.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
          </p>
        )}
      </div>

      {/* Lista de Lojas */}
      {filteredLojas.length === 0 ? (
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
        <div className="space-y-3">
          {filteredLojas.map((loja) => {
            const syncInfo = parseSyncStatus(loja.tempo_ultimo_envio);

            return (
              <div
                key={loja.codigo}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {/* Ícone de Status */}
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
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
                    <h3 className="font-semibold text-gray-900">{loja.loja}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {loja.codigo} • {loja.regional}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Tempo de Envio */}
                        <div className="flex items-center gap-0.5">
                          <ArrowUp className={`w-3 h-3 ${
                            syncInfo.status === 'warning'
                              ? 'text-yellow-600'
                              : syncInfo.status === 'offline' || syncInfo.status === 'unknown'
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`} />
                          <span className={`text-[10px] sm:text-xs ${
                            syncInfo.status === 'warning'
                              ? 'text-yellow-600 font-medium'
                              : syncInfo.status === 'offline' || syncInfo.status === 'unknown'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}>{syncInfo.label}</span>
                        </div>
                        {/* Tempo de Recebimento */}
                        <div className="flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {loja.tempo_ultimo_recebimento || '--'}
                          </span>
                        </div>
                      </div>
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
