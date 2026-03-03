import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { addDays } from '../../utils/dateUtils';
import type { InventoryItem, InventoryTransaction } from '../../types';

interface AnalyticsTabProps {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
}

export default function AnalyticsTab({ items, transactions: _transactions }: AnalyticsTabProps) {
  // ABC analysis
  const itemValues = items.map((item) => ({
    ...item,
    totalValue: item.currentStock * item.purchasePrice,
  })).sort((a, b) => b.totalValue - a.totalValue);

  const totalValue = itemValues.reduce((s, v) => s + v.totalValue, 0);
  let cumulative = 0;
  const classified = itemValues.map((item) => {
    cumulative += item.totalValue;
    const pct = totalValue > 0 ? cumulative / totalValue : 0;
    return { ...item, category: pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C' };
  });

  const aCount = classified.filter((c) => c.category === 'A').length;
  const bCount = classified.filter((c) => c.category === 'B').length;
  const cCount = classified.filter((c) => c.category === 'C').length;

  // Low stock alerts
  const lowStock = items.filter((i) => i.currentStock < i.minStock);

  // Expiring items (30 days)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = addDays(today, 30);
  const expiring = items.filter((i) => i.expiryDate && i.expiryDate <= thirtyDaysLater && i.expiryDate >= today);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Общая стоимость', value: formatCurrency(totalValue), gradient: 'from-blue-500 to-blue-600' },
          { label: 'Позиций', value: String(items.length), gradient: 'from-purple-500 to-purple-600' },
          { label: 'Низкий остаток', value: String(lowStock.length), gradient: 'from-red-500 to-red-600' },
          { label: 'Срок годности', value: String(expiring.length), gradient: 'from-yellow-500 to-yellow-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl shadow-md p-6 text-white`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ABC-анализ запасов</h3>
          <Bar data={{
            labels: ['Категория A', 'Категория B', 'Категория C'],
            datasets: [{ label: 'Кол-во позиций', data: [aCount, bCount, cCount], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderRadius: 6 }],
          }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Товары с низким остатком</h3>
          {lowStock.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600">{item.currentStock} / {item.minStock} {item.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Все остатки в норме</p>
          )}
        </div>
      </div>
    </div>
  );
}
