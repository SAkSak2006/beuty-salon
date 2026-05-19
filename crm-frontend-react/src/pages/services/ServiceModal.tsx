import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { serviceMaterialsApi, inventoryApi } from '../../api';
import type { Service, ServiceCategory, InventoryItem, ServiceMaterial } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => void;
  service?: Service | null;
  categories: ServiceCategory[];
}

export default function ServiceModal({ isOpen, onClose, onSave, service, categories }: ServiceModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'materials'>('basic');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [materials, setMaterials] = useState<ServiceMaterial[]>([]);
  const [newMaterialId, setNewMaterialId] = useState<number | ''>('');
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setCategoryId(service.categoryId);
      setPrice(service.price);
      setDuration(service.duration);
      setDescription(service.description || '');
      setIsActive(service.isActive);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPrice(0);
      setDuration(60);
      setDescription('');
      setIsActive(true);
    }
    setActiveTab('basic');
    setMaterials([]);
    setNewMaterialId('');
    setNewMaterialQty(1);
  }, [service, isOpen, categories]);

  useEffect(() => {
    if (isOpen) {
      inventoryApi.getAll().then(setInventoryItems).catch(() => {});
      if (service?.id) {
        setMaterialsLoading(true);
        serviceMaterialsApi.getAll()
          .then((all) => setMaterials(all.filter((m) => m.serviceId === service.id)))
          .catch(() => {})
          .finally(() => setMaterialsLoading(false));
      }
    }
  }, [isOpen, service?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    onSave({
      id: service?.id,
      name,
      categoryId: Number(categoryId),
      price,
      duration,
      description: description || undefined,
      isActive,
    });
    onClose();
  };

  const handleAddMaterial = async () => {
    if (!newMaterialId || !service?.id) return;
    try {
      const created = await serviceMaterialsApi.create({
        serviceId: service.id,
        inventoryId: Number(newMaterialId),
        quantity: newMaterialQty,
      });
      setMaterials((prev) => [...prev, created]);
      setNewMaterialId('');
      setNewMaterialQty(1);
    } catch { /* ignore */ }
  };

  const handleRemoveMaterial = async (id: number) => {
    try {
      await serviceMaterialsApi.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch { /* ignore */ }
  };

  const usedIds = new Set(materials.map((m) => m.inventoryId));
  const availableItems = inventoryItems.filter((i) => !usedIds.has(i.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Редактировать услугу' : 'Новая услуга'}>
      <div className="flex gap-4 mb-4 border-b">
        {(['basic', 'materials'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === tab ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'basic' ? 'Основное' : 'Материалы'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
                <option value="">Выберите категорию</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽) *</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин) *</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Активна</span>
            </label>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            {!service?.id && (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Сначала сохраните услугу, затем добавьте материалы.
              </p>
            )}
            {service?.id && (
              <>
                {materialsLoading ? (
                  <p className="text-sm text-gray-400">Загрузка...</p>
                ) : (
                  <div className="space-y-2">
                    {materials.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Материалы не добавлены</p>
                    )}
                    {materials.map((m) => {
                      const item = inventoryItems.find((i) => i.id === m.inventoryId);
                      return (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-800">{item?.name || `Товар #${m.inventoryId}`}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{m.quantity} {item?.unit || 'шт'}</span>
                            <button type="button" onClick={() => handleRemoveMaterial(m.id)}
                              className="text-red-400 hover:text-red-600 text-xs">
                              <i className="fas fa-times" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t">
                  <select value={newMaterialId} onChange={(e) => setNewMaterialId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
                    <option value="">Выберите товар...</option>
                    {availableItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input type="number" value={newMaterialQty} onChange={(e) => setNewMaterialQty(Number(e.target.value))}
                    min={0.1} step={0.1} className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
                  <button type="button" onClick={handleAddMaterial} disabled={!newMaterialId}
                    className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-40 text-sm">
                    <i className="fas fa-plus" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">Отмена</button>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            {service ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
