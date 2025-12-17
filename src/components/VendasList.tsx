import { useState } from 'react';
import { Store, TrendingUp, Package, Search } from 'lucide-react';
import { Venda } from '../types/api';

interface VendasListProps {
  vendas: Venda[];
  isLoading?: boolean;
}

export function VendasList({ vendas, isLoading }: VendasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Verifica se o tempo é maior que 1h (formato: XXd XXh XXm XXs)
  const isTempoMaiorQue1h = (tempo: string): boolean => {
    const match = tempo.match(/(\d+)d\s*(\d+)h/);
    if (!match) return false;
    const dias = parseInt(match[1]);
    const horas = parseInt(match[2]);
    return dias > 0 || horas >= 1;
  };

  // Primeiro ordena todas as vendas e adiciona o ranking original
  const vendasComRanking = [...vendas]
    .sort((a, b) => b.venda_total - a.venda_total)
    .map((venda, index) => ({ ...venda, ranking: index + 1 }));

  // Depois filtra mantendo o ranking original
  const filteredVendas = vendasComRanking.filter((venda) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const codigo = venda.codigo.toLowerCase();
    const loja = venda.loja.toLowerCase();
    const regional = venda.regional.toLowerCase();

    return codigo.includes(term) || loja.includes(term) || regional.includes(term);
  });

  const totalVendas = filteredVendas.reduce((acc, venda) => acc + venda.venda_total, 0);
  const totalQuantidade = filteredVendas.reduce((acc, venda) => acc + venda.total_quantidade, 0);
  const totalClientes = filteredVendas.reduce((acc, venda) => acc + venda.numero_vendas, 0);
  const ticketMedio = totalClientes > 0 ? totalVendas / totalClientes : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (vendas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhuma venda encontrada para este período</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold mb-3">{formatCurrency(totalVendas)}</p>
          <div className="pt-2 border-t border-white/20">
            <p className="text-xs opacity-75">Nº Clientes</p>
            <p className="text-sm font-semibold">{formatNumber(totalClientes)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Quantidade</span>
          </div>
          <p className="text-2xl font-bold mb-3">{formatNumber(totalQuantidade)}</p>
          <div className="pt-2 border-t border-white/20">
            <p className="text-xs opacity-75">Ticket Médio</p>
            <p className="text-sm font-semibold">{formatCurrency(ticketMedio)}</p>
          </div>
        </div>
      </div>

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
        <div className="space-y-3">
          {filteredVendas.map((venda) => (
          <div
            key={venda.codigo}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                  {venda.ranking}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{venda.loja}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Código: {venda.codigo} • {venda.regional} •{' '}
                    <span className={`${
                      isTempoMaiorQue1h(venda.tempo_ultimo_envio)
                        ? 'text-red-600 font-bold'
                        : ''
                    }`}>
                      {venda.tempo_ultimo_envio}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(venda.venda_total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Quantidade</p>
                <p className="text-lg font-bold text-gray-700">
                  {formatNumber(venda.total_quantidade)}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Nº Clientes</span>
                  <span className="font-semibold text-gray-700">
                    {formatNumber(venda.numero_vendas)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Ticket Médio</span>
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(venda.venda_total / venda.numero_vendas)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
