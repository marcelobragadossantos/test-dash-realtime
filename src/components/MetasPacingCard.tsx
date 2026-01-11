import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PacingData } from '../types/metas';

interface MetasPacingCardProps {
  pacing: PacingData;
  isLoading?: boolean;
}

/**
 * Card de Pacing (Ritmo de Vendas)
 * Mostra se a loja está adiantada ou atrasada em relação à meta sazonal
 */
export function MetasPacingCard({ pacing, isLoading }: MetasPacingCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusConfig = () => {
    switch (pacing.status) {
      case 'adiantado':
        return {
          icon: TrendingUp,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-500',
          label: 'Adiantado',
          description: 'Acima da meta sazonal esperada',
        };
      case 'atrasado':
        return {
          icon: TrendingDown,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-500',
          label: 'Atrasado',
          description: 'Abaixo da meta sazonal esperada',
        };
      default:
        return {
          icon: Minus,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-500',
          label: 'No Prazo',
          description: 'Dentro da margem esperada',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-xl shadow-sm border ${config.borderColor} ${config.bgColor} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Ritmo de Vendas (Pacing)</h3>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Principal */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${config.textColor}`}>
            {pacing.diferenca >= 0 ? '+' : ''}
            {formatCurrency(pacing.diferenca)}
          </span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            ({pacing.percentualDiferenca >= 0 ? '+' : ''}{pacing.percentualDiferenca.toFixed(1)}%)
          </span>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
          <div>
            <p className="text-xs text-gray-500 mb-1">Meta Esperada Hoje</p>
            <p className="text-lg font-semibold text-gray-800">
              {formatCurrency(pacing.metaAcumuladaHoje)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Realizado Hoje</p>
            <p className="text-lg font-semibold text-gray-800">
              {formatCurrency(pacing.vendasRealizadasHoje)}
            </p>
          </div>
        </div>

        {/* Badge de Status */}
        <div className="flex justify-center pt-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
            <Icon className="w-4 h-4" />
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
