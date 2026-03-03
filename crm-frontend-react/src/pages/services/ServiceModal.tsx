import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import type { Service, ServiceCategory } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => void;
  service?: Service | null;
  categories: ServiceCategory[];
}

export default function ServiceModal({ isOpen, onClose, onSave, service, categories }: ServiceModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setCategoryId(service.categoryId);
      setPrice(service.price);
      setDuration(service.duration);
      setDescription(service.description || '');
      setIsActive(service.isActive);
    } else {
      setName(''); setCategoryId(categories[0]?.id || ''); setPrice(0); setDuration(60); setDescription(''); setIsActive(true);
    }
  }, [service, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    onSave({
      id: service?.id, name, categoryId: Number(categoryId), price, duration,
      description: description || undefined, isActive,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Редактировать услугу' : 'Новая услуга'}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">Отмена</button>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            {service ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
