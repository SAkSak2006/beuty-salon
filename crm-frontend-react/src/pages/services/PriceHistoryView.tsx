import Modal from '../../components/ui/Modal';
import type { PriceHistory } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

interface PriceHistoryViewProps {
  isOpen: boolean;
  onClose: () => void;
  history: PriceHistory[];
  serviceName: string;
}

export default function PriceHistoryView({ isOpen, onClose, history, serviceName }: PriceHistoryViewProps) {
  const sorted = [...history].sort((a, b) => b.changeDate.localeCompare(a.changeDate));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`История цен: ${serviceName}`}>
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <span className="text-sm text-gray-500">{formatDate(h.changeDate)}</span>
                {h.reason && <span className="text-xs text-gray-400 ml-2">({h.reason})</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{formatCurrency(h.oldPrice)}</span>
                <i className="fas fa-arrow-right text-gray-300" />
                <span className={h.newPrice > h.oldPrice ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {formatCurrency(h.newPrice)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-8">Нет истории изменений цен</p>
      )}
    </Modal>
  );
}
