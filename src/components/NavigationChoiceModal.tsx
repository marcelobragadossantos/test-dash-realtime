import { useEffect, useRef } from 'react';
import { X, BarChart3, Target, Globe, Store } from 'lucide-react';

export type NavigationChoice = 'vendas' | 'metas_loja' | 'metas_regional';

interface NavigationChoiceModalProps {
  isOpen: boolean;
  lojaNome: string;
  lojaCodigo: string;
  regional: string;
  onClose: () => void;
  onChoose: (choice: NavigationChoice) => void;
}

/**
 * Modal de escolha de navegação
 * Exibe opções de ação ao clicar em um card de loja
 * Desktop: Modal centralizado | Mobile: Bottom Sheet
 */
export function NavigationChoiceModal({
  isOpen,
  lojaNome,
  lojaCodigo,
  regional,
  onClose,
  onChoose,
}: NavigationChoiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal / Bottom Sheet */}
      <div
        ref={modalRef}
        className="relative w-full sm:w-auto sm:min-w-[400px] sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl transform transition-all animate-slide-up sm:animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{lojaNome}</h3>
              <p className="text-xs text-gray-500">
                Código: {lojaCodigo} | Regional: {regional}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Opções */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 mb-4">O que você deseja fazer?</p>

          {/* Opção 1: Ver Vendas do Dia */}
          <button
            onClick={() => onChoose('vendas')}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">Ver Vendas do Dia</h4>
              <p className="text-xs text-gray-500">Continuar visualizando indicadores de vendas</p>
            </div>
          </button>

          {/* Opção 2: Analisar Metas da Loja */}
          <button
            onClick={() => onChoose('metas_loja')}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">Analisar Metas da Loja</h4>
              <p className="text-xs text-gray-500">Ver sazonalidade e ritmo de vendas desta loja</p>
            </div>
          </button>

          {/* Opção 3: Analisar Regional */}
          <button
            onClick={() => onChoose('metas_regional')}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">Analisar Regional</h4>
              <p className="text-xs text-gray-500">Ver ranking e metas de todas as lojas da região {regional}</p>
            </div>
          </button>
        </div>

        {/* Footer (mobile handle) */}
        <div className="sm:hidden h-1 w-12 bg-gray-300 rounded-full mx-auto mb-4" />
      </div>
    </div>
  );
}
