import { useState, useEffect, useMemo, useRef } from 'react';
import { clientsApi, appointmentsApi, servicesApi, employeesApi } from '../../api';
import { useUiStore } from '../../stores/uiStore';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ClientModal from './ClientModal';
import ClientCard from './ClientCard';
import { exportClientsCSV, parseClientsCSV } from './ClientImportExport';
import { formatCurrency } from '../../utils/formatters';
import { formatDate, addDays } from '../../utils/dateUtils';
import type { Client, Appointment, Service, Employee } from '../../types';

type SortColumn = 'name' | 'phone' | 'totalVisits' | 'totalSpent' | 'registrationDate';

export default function ClientsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cls, appts, svcs, emps] = await Promise.all([
        clientsApi.getAll(), appointmentsApi.getAll(), servicesApi.getAll(), employeesApi.getAll(),
      ]);
      setClients(cls); setAppointments(appts); setServices(svcs); setEmployees(emps);
    } catch { addToast('error', 'Ошибка загрузки клиентов'); }
    finally { setLoading(false); }
  };

  const filteredClients = useMemo(() => {
    let result = clients;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    result.sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [clients, debouncedSearch, sortColumn, sortDir]);

  const { page, totalPages, paginatedItems, goToPage, total } = usePagination(filteredClients, 20);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  const handleSave = async (data: Partial<Client>) => {
    try {
      if (data.id) {
        await clientsApi.update(data.id, data);
        addToast('success', 'Клиент обновлён');
      } else {
        await clientsApi.create({ ...data, totalVisits: 0, totalSpent: 0, registrationDate: new Date().toISOString().split('T')[0] });
        addToast('success', 'Клиент создан');
      }
      loadData();
    } catch { addToast('error', 'Ошибка сохранения'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientsApi.delete(deleteTarget.id);
      addToast('success', 'Клиент удалён');
      setDeleteTarget(null);
      loadData();
    } catch { addToast('error', 'Ошибка удаления'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseClientsCSV(text);
    if (parsed.length === 0) { addToast('error', 'Файл пуст или неверный формат'); return; }
    try {
      for (const c of parsed) {
        await clientsApi.create({ ...c, totalVisits: 0, totalSpent: 0, registrationDate: new Date().toISOString().split('T')[0] });
      }
      addToast('success', `Импортировано клиентов: ${parsed.length}`);
      loadData();
    } catch { addToast('error', 'Ошибка импорта'); }
    e.target.value = '';
  };

  // Statistics
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = addDays(today, -30);
  const stats = {
    total: clients.length,
    newThisMonth: clients.filter((c) => c.registrationDate >= monthAgo).length,
    active: new Set(appointments.filter((a) => a.date >= monthAgo && a.status === 'completed').map((a) => a.clientId)).size,
    avgCheck: (() => {
      const completed = appointments.filter((a) => a.status === 'completed');
      if (completed.length === 0) return 0;
      const totalSpent = clients.reduce((s, c) => s + c.totalSpent, 0);
      return Math.round(totalSpent / completed.length);
    })(),
  };

  const sortIcon = (col: SortColumn) => {
    if (sortColumn !== col) return 'fas fa-sort text-gray-300';
    return sortDir === 'asc' ? 'fas fa-sort-up text-pink-500' : 'fas fa-sort-down text-pink-500';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-users text-pink-500 mr-3" />База клиентов
          </h1>
          <p className="text-gray-500 mt-1">Управление клиентской базой салона</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditingClient(null); setModalOpen(true); }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            <i className="fas fa-user-plus mr-2" />Добавить клиента
          </button>
          <button onClick={() => exportClientsCSV(clients)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <i className="fas fa-file-export mr-2" />Экспорт CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i className="fas fa-file-import mr-2" />Импорт CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего клиентов', value: stats.total, icon: 'fa-users', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Новых за месяц', value: stats.newThisMonth, icon: 'fa-user-plus', gradient: 'from-green-500 to-green-600' },
          { label: 'Активных', value: stats.active, icon: 'fa-user-check', gradient: 'from-purple-500 to-purple-600' },
          { label: 'Средний чек', value: formatCurrency(stats.avgCheck), icon: 'fa-receipt', gradient: 'from-pink-500 to-pink-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl shadow-md p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <i className={`fas ${s.icon} text-4xl opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени или телефону..." />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {([
                  ['name', 'Имя'],
                  ['phone', 'Телефон'],
                  ['totalVisits', 'Визиты'],
                  ['totalSpent', 'Потрачено'],
                  ['registrationDate', 'Регистрация'],
                ] as [SortColumn, string][]).map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                    {label} <i className={sortIcon(col) + ' ml-1'} />
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => setViewingClient(client)} className="text-pink-600 hover:underline font-medium">
                      {client.name}
                    </button>
                    {client.source === 'telegram' && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">TG</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.totalVisits}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(client.totalSpent)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(client.registrationDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditingClient(client); setModalOpen(true); }}
                      className="text-blue-500 hover:text-blue-700 mr-3" title="Редактировать">
                      <i className="fas fa-edit" />
                    </button>
                    <button onClick={() => setDeleteTarget(client)}
                      className="text-red-500 hover:text-red-700" title="Удалить">
                      <i className="fas fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Клиенты не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t">
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} total={total} />
        </div>
      </div>

      <ClientModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} client={editingClient} />
      <ClientCard isOpen={!!viewingClient} onClose={() => setViewingClient(null)} client={viewingClient}
        appointments={appointments} services={services} employees={employees} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Удалить клиента"
        message={`Вы уверены, что хотите удалить клиента «${deleteTarget?.name}»?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} confirmText="Удалить" danger />
    </div>
  );
}
