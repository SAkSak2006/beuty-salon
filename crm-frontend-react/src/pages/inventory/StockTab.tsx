import { useState } from 'react';
import SearchInput from '../../components/ui/SearchInput';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { formatCurrency } from '../../utils/formatters';
import type { InventoryItem, InventoryCategory, Supplier } from '../../types';

interface StockTabProps {
  items: InventoryItem[];
  categories: InventoryCategory[];
  suppliers: Supplier[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onBarcode: (item: InventoryItem) => void;
}

export default function StockTab({ items, categories, suppliers, onEdit, onDelete, onBarcode }: StockTabProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<'' | 'critical' | 'low' | 'normal'>('');
  const debouncedSearch = useDebounce(search);

  const filtered = items.filter((item) => {
    if (debouncedSearch && !item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !item.sku.includes(debouncedSearch)) return false;
    if (catFilter && item.categoryId !== catFilter) return false;
    if (stockFilter === 'critical' && item.currentStock >= item.minStock * 0.5) return false;
    if (stockFilter === 'low' && (item.currentStock < item.minStock * 0.5 || item.currentStock >= item.minStock)) return false;
    if (stockFilter === 'normal' && item.currentStock < item.minStock) return false;
    return true;
  });

  const { page, totalPages, paginatedItems, goToPage, total } = usePagination(filtered, 20);

  const getStockColor = (item: InventoryItem) => {
    if (item.currentStock < item.minStock * 0.5) return 'bg-red-100 text-red-700';
    if (item.currentStock < item.minStock) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStockLabel = (item: InventoryItem) => {
    if (item.currentStock < item.minStock * 0.5) return 'Критический';
    if (item.currentStock < item.minStock) return 'Низкий';
    return 'Норма';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию или SKU..." /></div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-pink-500 focus:outline-none">
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-pink-500 focus:outline-none">
          <option value="">Все уровни</option>
          <option value="critical">Критический</option>
          <option value="low">Низкий</option>
          <option value="normal">Норма</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Наименование</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Категория</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Остаток</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Мин.</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Цена</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cat?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.currentStock} {item.unit}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{item.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStockColor(item)}`}>{getStockLabel(item)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.purchasePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onBarcode(item)} className="text-gray-400 hover:text-gray-600 mr-2" title="Штрих-код"><i className="fas fa-barcode" /></button>
                      <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 mr-2" title="Редактировать"><i className="fas fa-edit" /></button>
                      <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-700" title="Удалить"><i className="fas fa-trash" /></button>
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Товары не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t">
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} total={total} />
        </div>
      </div>
    </div>
  );
}
