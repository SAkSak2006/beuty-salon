import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentsApi, clientsApi, employeesApi, servicesApi, serviceCategoriesApi } from '../../api';
import { scheduleApi } from '../../api/endpoints/schedule';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AppointmentModal from './AppointmentModal';
import AppointmentFilters, { statusConfig } from './AppointmentFilters';
import { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from '../../utils/dateUtils';
import type { Appointment, Client, Employee, Service, ServiceCategory, Schedule, AppointmentStatus } from '../../types';

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUiStore((s) => s.addToast);
  const calendarRef = useRef<FullCalendar>(null);

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>(['confirmed', 'pending']);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [appts, cls, emps, svcs, cats, scheds] = await Promise.all([
        appointmentsApi.getAll(), clientsApi.getAll(), employeesApi.getAll(),
        servicesApi.getAll(), serviceCategoriesApi.getAll(), scheduleApi.getAll(),
      ]);
      setAppointments(appts);
      setClients(cls);
      setEmployees(emps);
      setServices(svcs);
      setCategories(cats);
      setSchedules(scheds);
      if (selectedEmployees.length === 0) {
        setSelectedEmployees(emps.map((e) => e.id));
      }
    } catch (err) {
      addToast('error', 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!selectedStatuses.includes(a.status)) return false;
    if (!selectedEmployees.includes(a.employeeId)) return false;
    if (user?.role === 'master' && user.employeeId && a.employeeId !== user.employeeId) return false;
    return true;
  });

  const calendarEvents = filteredAppointments.map((a) => {
    const client = clients.find((c) => c.id === a.clientId);
    const service = services.find((s) => s.id === a.serviceId);
    const employee = employees.find((e) => e.id === a.employeeId);
    const cfg = statusConfig[a.status] || { color: '#6b7280', label: a.status };

    return {
      id: String(a.id),
      title: `${client?.name || '—'} — ${service?.name || '—'}`,
      start: `${a.date}T${a.time}`,
      end: `${a.date}T${addMinutesStr(a.time, a.duration)}`,
      backgroundColor: cfg.color,
      borderColor: cfg.color,
      extendedProps: { appointment: a, employee: employee?.name },
    };
  });

  const handleSave = async (data: Partial<Appointment>) => {
    try {
      if (data.id) {
        await appointmentsApi.update(data.id, data);
        addToast('success', 'Запись обновлена');
      } else {
        await appointmentsApi.create(data);
        addToast('success', 'Запись создана');
      }
      loadData();
    } catch {
      addToast('error', 'Ошибка сохранения записи');
    }
  };

  const handleEventDrop = async (info: { event: { id: string; startStr: string } }) => {
    const apt = appointments.find((a) => a.id === Number(info.event.id));
    if (!apt) return;
    const start = new Date(info.event.startStr);
    const newDate = start.toISOString().split('T')[0];
    const newTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    try {
      await appointmentsApi.update(apt.id, { ...apt, date: newDate, time: newTime });
      addToast('success', 'Запись перенесена');
      loadData();
    } catch {
      addToast('error', 'Ошибка переноса');
    }
  };

  // Statistics
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getStartOfWeek(today);
  const weekEnd = getEndOfWeek(today);
  const monthStart = getStartOfMonth(today);
  const monthEnd = getEndOfMonth(today);

  const todayCount = appointments.filter((a) => a.date === today && a.status !== 'cancelled').length;
  const weekCount = appointments.filter((a) => a.date >= weekStart && a.date <= weekEnd && a.status !== 'cancelled').length;
  const monthCount = appointments.filter((a) => a.date >= monthStart && a.date <= monthEnd && a.status !== 'cancelled').length;
  const totalCount = appointments.length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
  const cancellationRate = totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-calendar-alt text-pink-500 mr-3" />Календарь записей
          </h1>
          <p className="text-gray-500 mt-1">Управление расписанием салона</p>
        </div>
        <button
          onClick={() => { setEditingAppointment(null); setModalOpen(true); }}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
        >
          <i className="fas fa-plus mr-2" />Новая запись
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Сегодня', value: todayCount, gradient: 'from-blue-500 to-blue-600' },
          { label: 'На неделю', value: weekCount, gradient: 'from-green-500 to-green-600' },
          { label: 'На месяц', value: monthCount, gradient: 'from-purple-500 to-purple-600' },
          { label: '% отмен', value: `${cancellationRate}%`, gradient: 'from-yellow-500 to-yellow-600' },
          { label: 'Всего', value: totalCount, gradient: 'from-pink-500 to-pink-600' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-xl shadow-md p-4 text-white`}>
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AppointmentFilters
            employees={employees}
            selectedEmployees={selectedEmployees}
            selectedStatuses={selectedStatuses}
            onToggleEmployee={(id) => {
              setSelectedEmployees((prev) =>
                prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
              );
            }}
            onToggleStatus={(status) => {
              setSelectedStatuses((prev) =>
                prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
              );
            }}
            onToday={() => calendarRef.current?.getApi().today()}
            onAddAppointment={() => { setEditingAppointment(null); setModalOpen(true); }}
          />
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale="ru"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            editable={true}
            selectable={true}
            events={calendarEvents}
            eventDrop={handleEventDrop}
            eventClick={(info) => {
              const apt = info.event.extendedProps.appointment as Appointment;
              setEditingAppointment(apt);
              setModalOpen(true);
            }}
            select={(_info) => {
              setEditingAppointment(null);
              setModalOpen(true);
            }}
            height="auto"
            buttonText={{
              today: 'Сегодня',
              month: 'Месяц',
              week: 'Неделя',
              day: 'День',
            }}
          />
        </div>
      </div>

      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        appointment={editingAppointment}
        clients={clients}
        employees={employees}
        services={services}
        categories={categories}
        appointments={appointments}
        schedules={schedules}
      />
    </div>
  );
}

function addMinutesStr(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
