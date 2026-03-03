import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import type { ServiceCategory } from '../../types';

interface BulkPriceChangeProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (percentage: number, categoryId?: number) => void;
  categories: ServiceCategory[];
}

export default function BulkPriceChange({ isOpen, onClose, onApply, categories }: BulkPriceChangeProps) {
  const [percentage, setPercentage] = useState(10);
  const [categoryId, setCategoryId] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(percentage, categoryId ? Number(categoryId) : undefined);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Массовое изменение цен" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Изменение (%)</label>
          <input type="number" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            placeholder="Положительное — увеличение, отрицательное — уменьшение" />
          <p className="text-xs text-gray-400 mt-1">Положительное значение — увеличение, отрицательное — уменьшение</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Категория (опционально)</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
            <option value="">Все категории</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">Отмена</button>
          <button type="submit" className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
            Применить
          </button>
        </div>
      </form>
    </Modal>
  );
}
