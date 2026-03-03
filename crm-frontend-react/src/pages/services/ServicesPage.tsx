import { useState, useEffect, useMemo } from 'react';
import { servicesApi, serviceCategoriesApi, priceHistoryApi } from '../../api';
import { appointmentsApi } from '../../api/endpoints/appointments';
import { useUiStore } from '../../stores/uiStore';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ServiceModal from './ServiceModal';
import ServiceCalculator from './ServiceCalculator';
import BulkPriceChange from './BulkPriceChange';
import PriceHistoryView from './PriceHistoryView';
import { formatCurrency, formatDuration } from '../../utils/formatters';
import type { Service, ServiceCategory, PriceHistory, Appointment } from '../../types';

export default function ServicesPage() {
  const addToast = useUiStore((s) => s.addToast);

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [historyService, setHistoryService] = useState<Service | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [svcs, cats, ph, appts] = await Promise.all([
        servicesApi.getAll(), serviceCategoriesApi.getAll(), priceHistoryApi.getAll(), appointmentsApi.getAll(),
      ]);
      setServices(svcs); setCategories(cats); setPriceHistory(ph); setAppointments(appts);
    } catch { addToast('error', 'Ошибка загрузки услуг'); }
    finally { setLoading(false); }
  };

  const filteredServices = useMemo(() => {
    let result = services;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter((s) => s.categoryId === categoryFilter);
    }
    return result;
  }, [services, debouncedSearch, categoryFilter]);

  const handleSave = async (data: Partial<Service>) => {
    try {
      if (data.id) {
        const old = services.find((s) => s.id === data.id);
        if (old && data.price !== undefined && data.price !== old.price) {
          await priceHistoryApi.create({
            serviceId: data.id, oldPrice: old.price, newPrice: data.price,
            changeDate: new Date().toISOString().split('T')[0], reason: 'Ручное изменение',
          });
        }
        await servicesApi.update(data.id, data);
        addToast('success', 'Услуга обновлена');
      } else {
        await servicesApi.create(data);
        addToast('success', 'Услуга создана');
      }
      loadData();
    } catch { addToast('error', 'Ошибка сохранения'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await servicesApi.delete(deleteTarget.id);
      addToast('success', 'Услуга удалена');
      setDeleteTarget(null);
      loadData();
    } catch { addToast('error', 'Ошибка удаления'); }
  };

  const handleBulkPrice = async (percentage: number, catId?: number) => {
    try {
      const toUpdate = services.filter((s) => s.isActive && (!catId || s.categoryId === catId));
      for (const svc of toUpdate) {
        const newPrice = Math.round(svc.price * (1 + percentage / 100));
        await priceHistoryApi.create({
          serviceId: svc.id, oldPrice: svc.price, newPrice,
          changeDate: new Date().toISOString().split('T')[0], reason: `Массовое изменение ${percentage}%`,
        });
        await servicesApi.update(svc.id, { price: newPrice });
      }
      addToast('success', `Цены обновлены для ${toUpdate.length} услуг`);
      loadData();
    } catch { addToast('error', 'Ошибка обновления цен'); }
  };

  const handleInlinePrice = async (service: Service, newPrice: number) => {
    if (newPrice === service.price || newPrice < 0) return;
    await handleSave({ id: service.id, price: newPrice });
  };

  // Stats
  const activeServices = services.filter((s) => s.isActive);
  const avgPrice = activeServices.length > 0 ? Math.round(activeServices.reduce((s, v) => s + v.price, 0) / activeServices.length) : 0;
  const completedAppts = appointments.filter((a) => a.status === 'completed');
  const totalRevenue = completedAppts.reduce((sum, a) => {
    const svc = services.find((s) => s.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  const toggleCategory = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-cut text-pink-500 mr-3" />Управление услугами
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCalculatorOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <i className="fas fa-calculator mr-2" />Калькулятор
          </button>
          <button onClick={() => setBulkPriceOpen(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
            <i className="fas fa-percentage mr-2" />Цены
          </button>
          <button onClick={() => { setEditingService(null); setModalOpen(true); }}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            <i className="fas fa-plus mr-2" />Новая услуга
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего услуг', value: services.length, icon: 'fa-list', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Активных', value: activeServices.length, icon: 'fa-check-circle', gradient: 'from-green-500 to-green-600' },
          { label: 'Средняя цена', value: formatCurrency(avgPrice), icon: 'fa-ruble-sign', gradient: 'from-yellow-500 to-yellow-600' },
          { label: 'Общая выручка', value: formatCurrency(totalRevenue), icon: 'fa-chart-line', gradient: 'from-purple-500 to-purple-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl shadow-md p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">{s.label}</p><p className="text-3xl font-bold mt-1">{s.value}</p></div>
              <i className={`fas ${s.icon} text-4xl opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Поиск услуг..." />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
            <option value="">Все категории</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Services Tree */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catServices = filteredServices.filter((s) => s.categoryId === cat.id);
          if (catServices.length === 0 && categoryFilter) return null;
          const isCollapsed = collapsed.has(cat.id);

          return (
            <div key={cat.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'} text-gray-400`} />
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{catServices.length}</span>
                </div>
              </button>
              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {catServices.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                      <div className="flex-1">
                        <span className={`font-medium ${svc.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                          {svc.name}
                        </span>
                        {svc.description && <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{formatDuration(svc.duration)}</span>
                        <input type="number" defaultValue={svc.price} min={0}
                          className="w-24 text-right px-2 py-1 border border-gray-200 rounded text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                          onBlur={(e) => handleInlinePrice(svc, Number(e.target.value))} />
                        <span className="text-xs text-gray-400">₽</span>
                        <div className="flex gap-1">
                          <button onClick={() => setHistoryService(svc)} className="text-gray-400 hover:text-purple-500 p-1" title="История цен">
                            <i className="fas fa-history" />
                          </button>
                          <button onClick={() => { setEditingService(svc); setModalOpen(true); }} className="text-gray-400 hover:text-blue-500 p-1" title="Редактировать">
                            <i className="fas fa-edit" />
                          </button>
                          <button onClick={() => setDeleteTarget(svc)} className="text-gray-400 hover:text-red-500 p-1" title="Удалить">
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {catServices.length === 0 && (
                    <p className="px-6 py-4 text-gray-400 text-sm">Нет услуг в этой категории</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ServiceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}
        service={editingService} categories={categories} />
      <ServiceCalculator isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)}
        services={services} categories={categories} />
      <BulkPriceChange isOpen={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)}
        onApply={handleBulkPrice} categories={categories} />
      <PriceHistoryView isOpen={!!historyService} onClose={() => setHistoryService(null)}
        history={priceHistory.filter((h) => h.serviceId === historyService?.id)}
        serviceName={historyService?.name || ''} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Удалить услугу"
        message={`Вы уверены, что хотите удалить услугу «${deleteTarget?.name}»?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} confirmText="Удалить" danger />
    </div>
  );
}
