import { useState, useEffect } from 'react';
import {
  inventoryApi, inventoryCategoriesApi, suppliersApi,
  inventoryTransactionsApi, purchaseOrdersApi,
} from '../../api';
import { employeesApi } from '../../api/endpoints/employees';
import { useUiStore } from '../../stores/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TabBar from '../../components/ui/TabBar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StockTab from './StockTab';
import MovementsTab from './MovementsTab';
import ProcurementTab from './ProcurementTab';
import AnalyticsTab from './AnalyticsTab';
import SettingsTab from './SettingsTab';
import BarcodeGenerator from './BarcodeGenerator';
import type {
  InventoryItem, InventoryCategory, Supplier,
  InventoryTransaction, PurchaseOrder, Employee,
} from '../../types';

const tabs = [
  { key: 'stock', label: 'Товары', icon: 'fas fa-box' },
  { key: 'movements', label: 'Движения', icon: 'fas fa-exchange-alt' },
  { key: 'procurement', label: 'Закупки', icon: 'fas fa-shopping-cart' },
  { key: 'analytics', label: 'Аналитика', icon: 'fas fa-chart-pie' },
  { key: 'settings', label: 'Настройки', icon: 'fas fa-cog' },
];

export default function InventoryPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [barcodeItem, setBarcodeItem] = useState<InventoryItem | null>(null);

  // Item form state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCatId, setFormCatId] = useState<number | ''>('');
  const [formSupplierId, setFormSupplierId] = useState<number | ''>('');
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(0);
  const [formUnit, setFormUnit] = useState('шт');
  const [formPrice, setFormPrice] = useState(0);
  const [formExpiry, setFormExpiry] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [inv, cats, sups, txns, ords, emps] = await Promise.all([
        inventoryApi.getAll(), inventoryCategoriesApi.getAll(), suppliersApi.getAll(),
        inventoryTransactionsApi.getAll(), purchaseOrdersApi.getAll(), employeesApi.getAll(),
      ]);
      setItems(inv); setCategories(cats); setSuppliers(sups);
      setTransactions(txns); setOrders(ords); setEmployees(emps);
    } catch { addToast('error', 'Ошибка загрузки склада'); }
    finally { setLoading(false); }
  };

  const openEditModal = (item: InventoryItem | null) => {
    if (item) {
      setEditingItem(item); setFormSku(item.sku); setFormName(item.name);
      setFormCatId(item.categoryId); setFormSupplierId(item.supplierId || '');
      setFormStock(item.currentStock); setFormMinStock(item.minStock);
      setFormUnit(item.unit); setFormPrice(item.purchasePrice);
      setFormExpiry(item.expiryDate || '');
    } else {
      setEditingItem(null); setFormSku(''); setFormName('');
      setFormCatId(''); setFormSupplierId('');
      setFormStock(0); setFormMinStock(5); setFormUnit('шт'); setFormPrice(0); setFormExpiry('');
    }
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<InventoryItem> = {
      sku: formSku, name: formName, categoryId: Number(formCatId) || 0,
      supplierId: formSupplierId ? Number(formSupplierId) : undefined,
      currentStock: formStock, minStock: formMinStock, unit: formUnit,
      purchasePrice: formPrice, expiryDate: formExpiry || undefined,
    };
    try {
      if (editingItem) {
        await inventoryApi.update(editingItem.id, data);
        addToast('success', 'Товар обновлён');
      } else {
        await inventoryApi.create(data);
        addToast('success', 'Товар создан');
      }
      setModalOpen(false);
      loadData();
    } catch { addToast('error', 'Ошибка сохранения'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.delete(deleteTarget.id);
      addToast('success', 'Товар удалён');
      setDeleteTarget(null);
      loadData();
    } catch { addToast('error', 'Ошибка удаления'); }
  };

  const handleGenerateOrder = async () => {
    const lowStockItems = items.filter((i) => i.currentStock < i.minStock);
    if (lowStockItems.length === 0) { addToast('info', 'Все остатки в норме'); return; }

    const bySupplier: Record<number, typeof lowStockItems> = {};
    lowStockItems.forEach((item) => {
      const supId = item.supplierId || 0;
      if (!bySupplier[supId]) bySupplier[supId] = [];
      bySupplier[supId].push(item);
    });

    try {
      for (const [supIdStr, supItems] of Object.entries(bySupplier)) {
        const supId = Number(supIdStr);
        await purchaseOrdersApi.create({
          supplierId: supId,
          items: supItems.map((i) => ({
            inventoryId: i.id,
            quantity: i.minStock * 2 - i.currentStock,
          })),
          status: 'pending',
          orderDate: new Date().toISOString().split('T')[0],
        });
      }
      addToast('success', `Создано заказов: ${Object.keys(bySupplier).length}`);
      loadData();
    } catch { addToast('error', 'Ошибка создания заказов'); }
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try {
      await purchaseOrdersApi.update(id, { status } as Partial<PurchaseOrder>);
      if (status === 'received') {
        const order = orders.find((o) => o.id === id);
        if (order?.items) {
          for (const oi of order.items) {
            const item = items.find((i) => i.id === oi.inventoryId);
            if (item) {
              await inventoryApi.update(item.id, { currentStock: item.currentStock + oi.quantity });
              await inventoryTransactionsApi.create({
                inventoryId: item.id, type: 'receipt', quantity: oi.quantity,
                date: new Date().toISOString().split('T')[0], reason: `Заказ #${id}`,
              });
            }
          }
        }
      }
      addToast('success', 'Статус обновлён');
      loadData();
    } catch { addToast('error', 'Ошибка обновления'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-box text-pink-500 mr-3" />Управление складом
          </h1>
          <p className="text-gray-500 mt-1">Учёт товаров и материалов</p>
        </div>
        <button onClick={() => openEditModal(null)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
          <i className="fas fa-plus mr-2" />Новый товар
        </button>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'stock' && (
        <StockTab items={items} categories={categories} suppliers={suppliers}
          onEdit={openEditModal} onDelete={setDeleteTarget} onBarcode={setBarcodeItem} />
      )}
      {activeTab === 'movements' && (
        <MovementsTab transactions={transactions} items={items} employees={employees} />
      )}
      {activeTab === 'procurement' && (
        <ProcurementTab orders={orders} suppliers={suppliers} items={items}
          onGenerateOrder={handleGenerateOrder} onUpdateStatus={handleUpdateOrderStatus} />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab items={items} transactions={transactions} />
      )}
      {activeTab === 'settings' && (
        <SettingsTab categories={categories} suppliers={suppliers}
          onSaveCategory={async (data) => {
            try { await inventoryCategoriesApi.create(data); loadData(); } catch { addToast('error', 'Ошибка'); }
          }}
          onDeleteCategory={async (id) => {
            try { await inventoryCategoriesApi.delete(id); loadData(); } catch { addToast('error', 'Ошибка'); }
          }}
          onSaveSupplier={async (data) => {
            try { await suppliersApi.create(data); loadData(); } catch { addToast('error', 'Ошибка'); }
          }}
          onDeleteSupplier={async (id) => {
            try { await suppliersApi.delete(id); loadData(); } catch { addToast('error', 'Ошибка'); }
          }}
        />
      )}

      {/* Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingItem ? 'Редактировать товар' : 'Новый товар'} size="lg">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input value={formSku} onChange={(e) => setFormSku(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Наименование *</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select value={formCatId} onChange={(e) => setFormCatId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
                <option value="">Без категории</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <select value={formSupplierId} onChange={(e) => setFormSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
                <option value="">Не указан</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текущий остаток</label>
              <input type="number" value={formStock} onChange={(e) => setFormStock(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Мин. остаток</label>
              <input type="number" value={formMinStock} onChange={(e) => setFormMinStock(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ед. измерения</label>
              <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
                <option>шт</option><option>мл</option><option>гр</option><option>л</option><option>кг</option><option>упак</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Закупочная цена (₽)</label>
              <input type="number" value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок годности</label>
              <input type="date" value={formExpiry} onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">Отмена</button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
              {editingItem ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      <BarcodeGenerator isOpen={!!barcodeItem} onClose={() => setBarcodeItem(null)} item={barcodeItem} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Удалить товар"
        message={`Вы уверены, что хотите удалить «${deleteTarget?.name}»?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} confirmText="Удалить" danger />
    </div>
  );
}
