import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../api';
import { appointmentsApi, clientsApi, employeesApi, servicesApi } from '../api';
import { paymentsApi } from '../api/endpoints/appointments';
import { scheduleApi } from '../api/endpoints/schedule';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RevenueChart from '../components/charts/RevenueChart';
import TopServicesChart from '../components/charts/TopServicesChart';
import { addDays } from '../utils/dateUtils';
import type { Appointment, Client, Employee, Service, Payment, Schedule } from '../types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appts, cls, emps, svcs, pays, scheds] = await Promise.all([
        appointmentsApi.getAll(),
        clientsApi.getAll(),
        employeesApi.getAll(),
        servicesApi.getAll(),
        paymentsApi.getAll(),
        scheduleApi.getAll(),
      ]);
      setAppointments(appts);
      setClients(cls);
      setEmployees(emps);
      setServices(svcs);
      setPayments(pays);
      setSchedules(scheds);
    } catch {
      // try report endpoints as fallback
      try {
        const data = await reportsApi.dashboard();
        if (data) {
          setAppointments(data.appointments || []);
          setClients(data.clients || []);
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = addDays(today, -30);

  // Calculate KPIs
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const recentPayments = completedPayments.filter((p) => p.date >= thirtyDaysAgo);
  const totalRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const recentAppointments = appointments.filter((a) => a.date >= thirtyDaysAgo && a.status === 'completed');
  const activeClientIds = new Set(recentAppointments.map((a) => a.clientId));
  const activeClients = activeClientIds.size;

  const avgCheck = recentAppointments.length > 0 ? Math.round(totalRevenue / recentAppointments.length) : 0;

  const newClients = clients.filter((c) => c.registrationDate >= thirtyDaysAgo).length;

  // Today's load
  const todayAppointments = appointments.filter((a) => a.date === today && a.status !== 'cancelled');
  const workingEmployees = employees.filter((e) => e.status === 'working');
  const todayDayOfWeek = new Date().getDay();
  const workingToday = workingEmployees.filter((emp) => {
    const empSchedule = schedules.find((s) => s.employeeId === emp.id && s.dayOfWeek === todayDayOfWeek);
    return empSchedule?.isWorkingDay;
  });
  const avgLoad = workingToday.length > 0
    ? Math.round((todayAppointments.length / (workingToday.length * 8)) * 100)
    : 0;

  // Revenue chart data (last 30 days)
  const revenueByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    revenueByDay[addDays(today, -i)] = 0;
  }
  recentPayments.forEach((p) => {
    if (revenueByDay[p.date] !== undefined) {
      revenueByDay[p.date] += Number(p.amount);
    }
  });
  const revenueLabels = Object.keys(revenueByDay).map((d) => {
    const date = new Date(d);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  });
  const revenueData = Object.values(revenueByDay);

  // Top services
  const serviceCounts: Record<number, { name: string; count: number }> = {};
  recentAppointments.forEach((a) => {
    if (!serviceCounts[a.serviceId]) {
      const svc = services.find((s) => s.id === a.serviceId);
      serviceCounts[a.serviceId] = { name: svc?.name || 'Неизвестно', count: 0 };
    }
    serviceCounts[a.serviceId].count++;
  });
  const topServices = Object.values(serviceCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Employee load today
  const employeeLoad = workingToday.map((emp) => {
    const empAppts = todayAppointments.filter((a) => a.employeeId === emp.id);
    const empSchedule = schedules.find((s) => s.employeeId === emp.id && s.dayOfWeek === todayDayOfWeek);
    let totalSlots = 8;
    if (empSchedule) {
      const [sh, sm] = empSchedule.startTime.split(':').map(Number);
      const [eh, em] = empSchedule.endTime.split(':').map(Number);
      totalSlots = Math.max(1, (eh * 60 + em - sh * 60 - sm) / 60);
    }
    const totalHours = empAppts.reduce((sum, a) => sum + (a.duration || 60) / 60, 0);
    return {
      name: emp.name,
      appointments: empAppts.length,
      loadPercent: Math.min(100, Math.round((totalHours / totalSlots) * 100)),
    };
  });

  // Upcoming appointments
  const upcoming = appointments
    .filter((a) => a.date > today || (a.date === today && a.status !== 'cancelled' && a.status !== 'completed'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  // Birthdays this week
  const weekEnd = addDays(today, 7);
  const birthdayClients = clients.filter((c) => {
    if (!c.birthdate) return false;
    const bd = new Date(c.birthdate);
    const thisYearBd = new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate());
    const todayDate = new Date(today);
    const weekEndDate = new Date(weekEnd);
    return thisYearBd >= todayDate && thisYearBd <= weekEndDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-home text-pink-500 mr-3" />
          Главная панель
        </h1>
        <div className="flex gap-2">
          <Link to="/appointments" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
            <i className="fas fa-plus mr-2" />Новая запись
          </Link>
          <Link to="/reports" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition">
            <i className="fas fa-chart-bar mr-2" />Отчеты
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i className="fas fa-ruble-sign text-2xl" />
            </div>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">30 дней</span>
          </div>
          <p className="text-3xl font-bold mb-1">{totalRevenue.toLocaleString('ru-RU')}</p>
          <p className="text-sm opacity-90">Выручка (₽)</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i className="fas fa-users text-2xl" />
            </div>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">30 дней</span>
          </div>
          <p className="text-3xl font-bold mb-1">{activeClients}</p>
          <p className="text-sm opacity-90">Активных клиентов</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i className="fas fa-receipt text-2xl" />
            </div>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">30 дней</span>
          </div>
          <p className="text-3xl font-bold mb-1">{avgCheck.toLocaleString('ru-RU')}</p>
          <p className="text-sm opacity-90">Средний чек (₽)</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i className="fas fa-tasks text-2xl" />
            </div>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">Сегодня</span>
          </div>
          <p className="text-3xl font-bold mb-1">{avgLoad}%</p>
          <p className="text-sm opacity-90">Загрузка мастеров</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i className="fas fa-user-plus text-2xl" />
            </div>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">30 дней</span>
          </div>
          <p className="text-3xl font-bold mb-1">{newClients}</p>
          <p className="text-sm opacity-90">Новых клиентов</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fas fa-chart-line text-pink-500 mr-2" />Динамика выручки
          </h3>
          <RevenueChart labels={revenueLabels} data={revenueData} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fas fa-star text-purple-500 mr-2" />Топ-5 услуг
          </h3>
          {topServices.length > 0 ? (
            <TopServicesChart
              labels={topServices.map((s) => s.name)}
              data={topServices.map((s) => s.count)}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Нет данных</p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee load */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fas fa-user-clock text-green-500 mr-2" />Загрузка мастеров сегодня
          </h3>
          {employeeLoad.length > 0 ? (
            <div className="space-y-3">
              {employeeLoad.map((emp, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="text-gray-700 truncate">{emp.name}</span>
                    <span className="text-gray-500 whitespace-nowrap">{emp.appointments} записей — {emp.loadPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        emp.loadPercent > 80 ? 'bg-red-500' : emp.loadPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${emp.loadPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Нет рабочих мастеров сегодня</p>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fas fa-calendar text-blue-500 mr-2" />Ближайшие записи
          </h3>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((apt) => {
                const client = clients.find((c) => c.id === apt.clientId);
                const service = services.find((s) => s.id === apt.serviceId);
                const employee = employees.find((e) => e.id === apt.employeeId);
                return (
                  <div key={apt.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="text-center bg-pink-50 rounded-lg px-2 py-1 min-w-[60px]">
                      <div className="text-xs text-gray-500">{apt.date.slice(5)}</div>
                      <div className="text-sm font-semibold text-pink-600">{apt.time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{client?.name || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{service?.name} — {employee?.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Нет предстоящих записей</p>
          )}
        </div>

        {/* Birthdays */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fas fa-birthday-cake text-amber-500 mr-2" />Дни рождения на этой неделе
          </h3>
          {birthdayClients.length > 0 ? (
            <div className="space-y-3">
              {birthdayClients.map((client) => (
                <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-gift text-amber-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Нет дней рождения на этой неделе</p>
          )}
        </div>
      </div>
    </div>
  );
}
