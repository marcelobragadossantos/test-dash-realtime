import { Store, TrendingUp, Package } from 'lucide-react';
import { Venda } from '../types/api';

interface VendasListProps {
  vendas: Venda[];
  isLoading?: boolean;
}

export function VendasList({ vendas, isLoading }: VendasListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const sortedVendas = [...vendas].sort((a, b) => b.venda_total - a.venda_total);

  const totalVendas = vendas.reduce((acc, venda) => acc + venda.venda_total, 0);
  const totalQuantidade = vendas.reduce((acc, venda) => acc + venda.total_quantidade, 0);

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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalVendas)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Quantidade</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totalQuantidade)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedVendas.map((venda, index) => (
          <div
            key={venda.codigo}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{venda.loja}</h3>
                  <p className="text-xs text-gray-500">Código: {venda.codigo}</p>
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Ticket Médio</span>
                <span className="font-semibold text-gray-700">
                  {formatCurrency(venda.venda_total / venda.total_quantidade)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
