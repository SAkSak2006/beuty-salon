import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import type { Service, ServiceCategory } from '../../types';
import { formatCurrency, formatDuration } from '../../utils/formatters';

interface ServiceCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  categories: ServiceCategory[];
}

export default function ServiceCalculator({ isOpen, onClose, services, categories }: ServiceCalculatorProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [discount, setDiscount] = useState(0);

  const toggleService = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedServices = services.filter((s) => selected.has(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const discountAmount = Math.round(totalPrice * discount / 100);
  const finalPrice = totalPrice - discountAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Калькулятор услуг" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Выберите услуги:</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.categoryId === cat.id && s.isActive);
              if (catServices.length === 0) return null;
              return (
                <div key={cat.id}>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{cat.name}</p>
                  {catServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleService(s.id)}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded" />
                      <span className="flex-1 text-sm">{s.name}</span>
                      <span className="text-sm text-gray-500">{formatCurrency(s.price)}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-700">Итого:</h4>
          {selectedServices.length > 0 ? (
            <>
              <div className="space-y-1">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>{s.name}</span>
                    <span>{formatCurrency(s.price)}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div>
                <label className="block text-sm text-gray-600 mb-1">Скидка (%)</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} max={100}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between"><span>Сумма:</span><span>{formatCurrency(totalPrice)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Скидка:</span><span>-{formatCurrency(discountAmount)}</span></div>
                )}
                <div className="flex justify-between text-lg"><span>Итого:</span><span className="text-pink-600">{formatCurrency(finalPrice)}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>Время:</span><span>{formatDuration(totalDuration)}</span></div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Выберите услуги для расчёта</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
