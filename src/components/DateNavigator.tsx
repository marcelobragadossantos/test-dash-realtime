import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, isAfter, isSameDay, startOfDay, startOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViewMode } from '../types/api';

interface DateNavigatorProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function DateNavigator({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
}: DateNavigatorProps) {
  const today = startOfDay(new Date());
  const currentMonth = startOfMonth(new Date());

  // Verifica se pode avançar para o próximo período
  const canGoNext = () => {
    if (viewMode === 'day') {
      return !isSameDay(currentDate, today) && !isAfter(currentDate, today);
    } else {
      return !isSameMonth(currentDate, currentMonth) && !isAfter(currentDate, currentMonth);
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const handleDateInput = () => {
    const input = document.createElement('input');
    input.type = 'date';
    input.value = format(currentDate, 'yyyy-MM-dd');
    input.max = format(today, 'yyyy-MM-dd'); // Limita seleção até hoje
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        const selectedDate = startOfDay(new Date(target.value));
        // Valida se a data não é futura
        if (!isAfter(selectedDate, today)) {
          onDateChange(selectedDate);
        }
      }
      document.body.removeChild(input);
    });

    input.showPicker();
  };

  const getDisplayDate = () => {
    if (viewMode === 'day') {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Período</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'day'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Período anterior"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={handleDateInput}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700 capitalize">
            {getDisplayDate()}
          </span>
        </button>

        <button
          onClick={handleNext}
          disabled={!canGoNext()}
          className={`p-2 rounded-md transition-colors ${
            canGoNext()
              ? 'hover:bg-gray-100 text-gray-600'
              : 'cursor-not-allowed text-gray-300'
          }`}
          aria-label="Próximo período"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
