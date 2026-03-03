import { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { appointmentsApi, clientsApi, employeesApi, servicesApi } from '../../api';
import { paymentsApi } from '../../api/endpoints/appointments';
import { useUiStore } from '../../stores/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TabBar from '../../components/ui/TabBar';
import { formatCurrency } from '../../utils/formatters';
import { addDays } from '../../utils/dateUtils';
import { exportCSV, exportPDF } from '../../utils/exportUtils';
import type { Appointment, Client, Employee, Service, Payment } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const tabs = [
  { key: 'financial', label: 'Финансы', icon: 'fas fa-ruble-sign' },
  { key: 'clients', label: 'Клиенты', icon: 'fas fa-users' },
  { key: 'services', label: 'Услуги', icon: 'fas fa-cut' },
  { key: 'personnel', label: 'Персонал', icon: 'fas fa-user-tie' },
];

const periods = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '3 мес.', days: 90 },
  { label: '6 мес.', days: 180 },
  { label: '1 год', days: 365 },
];

export default function ReportsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial');
  const [periodDays, setPeriodDays] = useState(30);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [appts, cls, emps, svcs, pays] = await Promise.all([
        appointmentsApi.getAll(), clientsApi.getAll(), employeesApi.getAll(),
        servicesApi.getAll(), paymentsApi.getAll(),
      ]);
      setAppointments(appts); setClients(cls); setEmployees(emps); setServices(svcs); setPayments(pays);
    } catch { addToast('error', 'Ошибка загрузки данных'); }
    finally { setLoading(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const startDate = addDays(today, -periodDays);

  const periodAppointments = useMemo(() =>
    appointments.filter((a) => a.date >= startDate && a.date <= today), [appointments, startDate, today]);
  const completedAppts = useMemo(() =>
    periodAppointments.filter((a) => a.status === 'completed'), [periodAppointments]);
  const periodPayments = useMemo(() =>
    payments.filter((p) => p.date >= startDate && p.date <= today && p.status === 'completed'), [payments, startDate, today]);

  const totalRevenue = periodPayments.reduce((s, p) => s + p.amount, 0);

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = periodDays - 1; i >= 0; i--) map[addDays(today, -i)] = 0;
    periodPayments.forEach((p) => { if (map[p.date] !== undefined) map[p.date] += p.amount; });
    return map;
  }, [periodPayments, periodDays, today]);

  const handleExportCSV = () => {
    const data = completedAppts.map((a) => {
      const client = clients.find((c) => c.id === a.clientId);
      const service = services.find((s) => s.id === a.serviceId);
      const employee = employees.find((e) => e.id === a.employeeId);
      return { date: a.date, time: a.time, client: client?.name, service: service?.name, employee: employee?.name, status: a.status };
    });
    exportCSV(data, 'report', { date: 'Дата', time: 'Время', client: 'Клиент', service: 'Услуга', employee: 'Мастер', status: 'Статус' });
    addToast('success', 'CSV экспортирован');
  };

  const handleExportPDF = () => {
    const headers = ['Дата', 'Клиент', 'Услуга', 'Мастер'];
    const content = completedAppts.map((a) => [
      a.date, clients.find((c) => c.id === a.clientId)?.name || '',
      services.find((s) => s.id === a.serviceId)?.name || '',
      employees.find((e) => e.id === a.employeeId)?.name || '',
    ]);
    exportPDF('Отчёт BeautySalon', content, headers);
    addToast('success', 'PDF экспортирован');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-chart-line text-pink-500 mr-3" />Отчёты и аналитика
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
            <i className="fas fa-file-csv mr-2" />CSV
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
            <i className="fas fa-file-pdf mr-2" />PDF
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {periods.map((p) => (
          <button key={p.days} onClick={() => setPeriodDays(p.days)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              periodDays === p.days ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'financial' && (
        <FinancialTab revenueByDay={revenueByDay} totalRevenue={totalRevenue}
          payments={periodPayments} employees={employees} completedAppts={completedAppts} services={services} />
      )}
      {activeTab === 'clients' && (
        <ClientsTab clients={clients} appointments={periodAppointments} startDate={startDate} />
      )}
      {activeTab === 'services' && (
        <ServicesTab services={services} completedAppts={completedAppts} />
      )}
      {activeTab === 'personnel' && (
        <PersonnelTab employees={employees} completedAppts={completedAppts} services={services} />
      )}
    </div>
  );
}

function FinancialTab({ revenueByDay, totalRevenue, payments, employees, completedAppts, services }: {
  revenueByDay: Record<string, number>; totalRevenue: number; payments: Payment[];
  employees: Employee[]; completedAppts: Appointment[]; services: Service[];
}) {
  const labels = Object.keys(revenueByDay).map((d) => { const dt = new Date(d); return `${dt.getDate()}.${dt.getMonth() + 1}`; });
  const data = Object.values(revenueByDay);

  const cashTotal = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
  const cardTotal = payments.filter((p) => p.method === 'card').reduce((s, p) => s + p.amount, 0);

  const salaryExpenses = employees.filter((e) => e.status === 'working').reduce((s, e) => s + e.salary, 0);
  const commissionExpenses = employees.reduce((s, emp) => {
    const empRevenue = completedAppts.filter((a) => a.employeeId === emp.id)
      .reduce((sum, a) => sum + (services.find((sv) => sv.id === a.serviceId)?.price || 0), 0);
    return s + Math.round(empRevenue * emp.commission / 100);
  }, 0);
  const totalExpenses = salaryExpenses + commissionExpenses;
  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Выручка', value: formatCurrency(totalRevenue), gradient: 'from-green-500 to-green-600', icon: 'fa-ruble-sign' },
          { label: 'Расходы на ЗП', value: formatCurrency(totalExpenses), gradient: 'from-red-500 to-red-600', icon: 'fa-money-bill' },
          { label: 'Прибыль', value: formatCurrency(profit), gradient: profit >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600', icon: 'fa-chart-line' },
          { label: 'Записей', value: String(completedAppts.length), gradient: 'from-purple-500 to-purple-600', icon: 'fa-calendar-check' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl shadow-md p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm opacity-90">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
              <i className={`fas ${s.icon} text-3xl opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Динамика выручки</h3>
          <Line data={{ labels, datasets: [{ label: 'Выручка', data, borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)', fill: true, tension: 0.4 }] }}
            options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Способы оплаты</h3>
          <Doughnut data={{
            labels: ['Наличные', 'Карта'],
            datasets: [{ data: [cashTotal, cardTotal], backgroundColor: ['#f59e0b', '#3b82f6'], borderWidth: 0 }],
          }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  );
}

function ClientsTab({ clients, appointments, startDate }: { clients: Client[]; appointments: Appointment[]; startDate: string }) {
  const newClients = clients.filter((c) => c.registrationDate >= startDate).length;
  const activeIds = new Set(appointments.filter((a) => a.status === 'completed').map((a) => a.clientId));
  const active = activeIds.size;
  const totalSpent = clients.reduce((s, c) => s + c.totalSpent, 0);
  const avgLTV = clients.length > 0 ? Math.round(totalSpent / clients.length) : 0;

  // RFM segments
  const segments = { vip: 0, loyal: 0, new_client: 0, at_risk: 0, lost: 0 };
  const today = new Date();
  clients.forEach((c) => {
    const recency = c.lastVisit ? Math.ceil((today.getTime() - new Date(c.lastVisit).getTime()) / 86400000) : 999;
    const frequency = c.totalVisits;
    if (recency <= 30 && frequency >= 5) segments.vip++;
    else if (recency <= 60 && frequency >= 3) segments.loyal++;
    else if (recency <= 30 && frequency <= 2) segments.new_client++;
    else if (recency > 60 && frequency >= 3) segments.at_risk++;
    else if (recency > 90) segments.lost++;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего', value: clients.length, gradient: 'from-blue-500 to-blue-600' },
          { label: 'Новых', value: newClients, gradient: 'from-green-500 to-green-600' },
          { label: 'Активных', value: active, gradient: 'from-purple-500 to-purple-600' },
          { label: 'Сред. LTV', value: formatCurrency(avgLTV), gradient: 'from-pink-500 to-pink-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} rounded-xl shadow-md p-6 text-white`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">RFM-сегментация</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'VIP', value: segments.vip, color: 'text-amber-600 bg-amber-50' },
            { label: 'Лояльные', value: segments.loyal, color: 'text-green-600 bg-green-50' },
            { label: 'Новые', value: segments.new_client, color: 'text-blue-600 bg-blue-50' },
            { label: 'Под угрозой', value: segments.at_risk, color: 'text-orange-600 bg-orange-50' },
            { label: 'Потерянные', value: segments.lost, color: 'text-red-600 bg-red-50' },
          ].map((seg, i) => (
            <div key={i} className={`rounded-lg p-4 text-center ${seg.color}`}>
              <p className="text-2xl font-bold">{seg.value}</p>
              <p className="text-sm mt-1">{seg.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesTab({ services, completedAppts }: { services: Service[]; completedAppts: Appointment[] }) {
  const serviceStats = services.map((s) => {
    const count = completedAppts.filter((a) => a.serviceId === s.id).length;
    return { ...s, count, revenue: count * s.price };
  }).sort((a, b) => b.revenue - a.revenue);

  // ABC analysis
  const totalRevenue = serviceStats.reduce((s, v) => s + v.revenue, 0);
  let cumulative = 0;
  const classified = serviceStats.map((s) => {
    cumulative += s.revenue;
    const pct = totalRevenue > 0 ? cumulative / totalRevenue : 0;
    const category = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
    return { ...s, category };
  });

  const catColors: Record<string, string> = { A: 'bg-green-100 text-green-700', B: 'bg-yellow-100 text-yellow-700', C: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">ABC-анализ услуг</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ABC</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Услуга</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Записей</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Выручка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classified.filter((s) => s.count > 0).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-bold ${catColors[s.category]}`}>{s.category}</span></td>
                  <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{s.count}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Популярность услуг</h3>
        <Bar data={{
          labels: serviceStats.filter((s) => s.count > 0).slice(0, 10).map((s) => s.name),
          datasets: [{ label: 'Записей', data: serviceStats.filter((s) => s.count > 0).slice(0, 10).map((s) => s.count),
            backgroundColor: '#ec4899', borderRadius: 6 }],
        }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
}

function PersonnelTab({ employees, completedAppts, services }: { employees: Employee[]; completedAppts: Appointment[]; services: Service[] }) {
  const empStats = employees.filter((e) => e.status === 'working').map((emp) => {
    const empAppts = completedAppts.filter((a) => a.employeeId === emp.id);
    const revenue = empAppts.reduce((s, a) => s + (services.find((sv) => sv.id === a.serviceId)?.price || 0), 0);
    const totalHours = empAppts.reduce((s, a) => s + (a.duration || 60) / 60, 0);
    return {
      ...emp, appointmentsCount: empAppts.length, revenue,
      totalHours: Math.round(totalHours * 10) / 10,
      revenuePerHour: totalHours > 0 ? Math.round(revenue / totalHours) : 0,
      avgCheck: empAppts.length > 0 ? Math.round(revenue / empAppts.length) : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Эффективность сотрудников</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Сотрудник</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Записей</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Часов</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Выручка</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">₽/час</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Сред. чек</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empStats.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{emp.appointmentsCount}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{emp.totalHours}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(emp.revenue)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(emp.revenuePerHour)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(emp.avgCheck)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
