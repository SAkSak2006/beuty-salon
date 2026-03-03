import type { PurchaseOrder, Supplier, InventoryItem } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

const statusLabels: Record<string, string> = { pending: 'Ожидает', ordered: 'Заказано', received: 'Получено' };
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', ordered: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700',
};

interface ProcurementTabProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  items: InventoryItem[];
  onGenerateOrder: () => void;
  onUpdateStatus: (id: number, status: string) => void;
}

export default function ProcurementTab({ orders, suppliers, items, onGenerateOrder, onUpdateStatus }: ProcurementTabProps) {
  const sorted = [...orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onGenerateOrder}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
          <i className="fas fa-magic mr-2" />Автоматический заказ
        </button>
      </div>

      <div className="space-y-4">
        {sorted.map((order) => {
          const supplier = suppliers.find((s) => s.id === order.supplierId);
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Заказ #{order.id}</h4>
                  <p className="text-sm text-gray-500">{supplier?.name || 'Поставщик не указан'} — {formatDate(order.orderDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full ${statusColors[order.status] || ''}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  {order.status === 'pending' && (
                    <button onClick={() => onUpdateStatus(order.id, 'ordered')}
                      className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Оформить
                    </button>
                  )}
                  {order.status === 'ordered' && (
                    <button onClick={() => onUpdateStatus(order.id, 'received')}
                      className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      Получено
                    </button>
                  )}
                </div>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="text-sm text-gray-600">
                  {order.items.map((oi, i) => {
                    const item = items.find((it) => it.id === oi.inventoryId);
                    return <div key={i}>{item?.name || '—'} × {oi.quantity}</div>;
                  })}
                </div>
              )}
              {order.totalAmount !== undefined && (
                <p className="mt-2 text-sm font-medium">Итого: {formatCurrency(order.totalAmount)}</p>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-gray-400 text-center py-8">Нет заказов на закупку</p>
        )}
      </div>
    </div>
  );
}
