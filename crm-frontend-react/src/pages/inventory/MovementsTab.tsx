import { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import type { InventoryTransaction, InventoryItem, Employee } from '../../types';

const typeLabels: Record<string, string> = {
  receipt: 'Поступление', consumption: 'Расход', adjustment: 'Корректировка', writeoff: 'Списание',
};
const typeColors: Record<string, string> = {
  receipt: 'bg-green-100 text-green-700', consumption: 'bg-red-100 text-red-700',
  adjustment: 'bg-blue-100 text-blue-700', writeoff: 'bg-gray-100 text-gray-700',
};

interface MovementsTabProps {
  transactions: InventoryTransaction[];
  items: InventoryItem[];
  employees: Employee[];
}

export default function MovementsTab({ transactions, items, employees }: MovementsTabProps) {
  const [search, setSearch] = useState('');

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((t) => {
    if (!search) return true;
    const item = items.find((i) => i.id === t.inventoryId);
    return item?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по товару..."
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none" />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Товар</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Тип</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Кол-во</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Причина</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Сотрудник</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.slice(0, 50).map((t) => {
              const item = items.find((i) => i.id === t.inventoryId);
              const emp = employees.find((e) => e.id === t.employeeId);
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item?.name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[t.type] || ''}`}>{typeLabels[t.type] || t.type}</span>
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${t.type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'receipt' ? '+' : '-'}{t.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.reason || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{emp?.name || '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет движений</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
