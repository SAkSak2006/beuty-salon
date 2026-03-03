import { useState } from 'react';
import type { InventoryCategory, Supplier } from '../../types';

interface SettingsTabProps {
  categories: InventoryCategory[];
  suppliers: Supplier[];
  onSaveCategory: (data: Partial<InventoryCategory>) => void;
  onDeleteCategory: (id: number) => void;
  onSaveSupplier: (data: Partial<Supplier>) => void;
  onDeleteSupplier: (id: number) => void;
}

export default function SettingsTab({ categories, suppliers, onSaveCategory, onDeleteCategory, onSaveSupplier, onDeleteSupplier }: SettingsTabProps) {
  const [catName, setCatName] = useState('');
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supContact, setSupContact] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onSaveCategory({ name: catName.trim() });
    setCatName('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    onSaveSupplier({ name: supName.trim(), phone: supPhone || undefined, contactPerson: supContact || undefined });
    setSupName(''); setSupPhone(''); setSupContact('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <i className="fas fa-tags text-purple-500 mr-2" />Категории товаров
        </h3>
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Название категории"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
          <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm">
            <i className="fas fa-plus" />
          </button>
        </form>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-sm">{cat.name}</span>
              <button onClick={() => onDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash text-xs" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <i className="fas fa-truck text-blue-500 mr-2" />Поставщики
        </h3>
        <form onSubmit={handleAddSupplier} className="space-y-2 mb-4">
          <input value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Название компании"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
          <div className="flex gap-2">
            <input value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder="Контактное лицо"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
            <input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="Телефон"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm">
            <i className="fas fa-plus mr-2" />Добавить поставщика
          </button>
        </form>
        <div className="space-y-2">
          {suppliers.map((sup) => (
            <div key={sup.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div>
                <span className="text-sm font-medium">{sup.name}</span>
                {sup.contactPerson && <span className="text-xs text-gray-400 ml-2">({sup.contactPerson})</span>}
              </div>
              <button onClick={() => onDeleteSupplier(sup.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash text-xs" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
