import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import type { Appointment, Client, Employee, Service, ServiceCategory, AppointmentStatus } from '../../types';
import { getCurrentDate, addMinutesToTime, compareTimes } from '../../utils/dateUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Appointment>) => void;
  appointment?: Appointment | null;
  clients: Client[];
  employees: Employee[];
  services: Service[];
  categories: ServiceCategory[];
  appointments: Appointment[];
  schedules: { employeeId: number; dayOfWeek: number; startTime: string; endTime: string; isWorkingDay: boolean }[];
}

export default function AppointmentModal({
  isOpen, onClose, onSave, appointment, clients, employees, services, categories, appointments, schedules,
}: AppointmentModalProps) {
  const [clientId, setClientId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [availabilityMsg, setAvailabilityMsg] = useState('');

  useEffect(() => {
    if (appointment) {
      setClientId(appointment.clientId);
      setServiceId(appointment.serviceId);
      setEmployeeId(appointment.employeeId);
      setDate(appointment.date);
      setTime(appointment.time);
      setDuration(appointment.duration);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
    } else {
      setClientId('');
      setServiceId('');
      setEmployeeId('');
      setDate(getCurrentDate());
      setTime('10:00');
      setDuration(60);
      setStatus('pending');
      setNotes('');
    }
    setAvailabilityMsg('');
  }, [appointment, isOpen]);

  useEffect(() => {
    if (serviceId) {
      const svc = services.find((s) => s.id === serviceId);
      if (svc) setDuration(svc.duration);
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (employeeId && date && time && duration) {
      checkAvailability();
    }
  }, [employeeId, date, time, duration]);

  const checkAvailability = () => {
    if (!employeeId || !date || !time) return;
    const dayOfWeek = new Date(date).getDay();
    const empSchedule = schedules.find(
      (s) => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek
    );

    if (!empSchedule || !empSchedule.isWorkingDay) {
      setAvailabilityMsg('Мастер не работает в этот день');
      return;
    }

    const endTime = addMinutesToTime(time, duration);
    if (compareTimes(time, empSchedule.startTime) < 0 || compareTimes(endTime, empSchedule.endTime) > 0) {
      setAvailabilityMsg(`Рабочие часы: ${empSchedule.startTime}–${empSchedule.endTime}`);
      return;
    }

    const conflicts = appointments.filter((a) => {
      if (a.employeeId !== employeeId || a.date !== date) return false;
      if (a.status === 'cancelled') return false;
      if (appointment && a.id === appointment.id) return false;
      const aEnd = addMinutesToTime(a.time, a.duration);
      return !(compareTimes(endTime, a.time) <= 0 || compareTimes(time, aEnd) >= 0);
    });

    if (conflicts.length > 0) {
      setAvailabilityMsg('Конфликт с другой записью');
    } else {
      setAvailabilityMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !serviceId || !employeeId) return;
    onSave({
      id: appointment?.id,
      clientId: Number(clientId),
      serviceId: Number(serviceId),
      employeeId: Number(employeeId),
      date,
      time,
      duration,
      status,
      notes,
    });
    onClose();
  };

  const groupedServices = categories.map((cat) => ({
    category: cat,
    services: services.filter((s) => s.categoryId === cat.id && s.isActive),
  })).filter((g) => g.services.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={appointment ? 'Редактировать запись' : 'Новая запись'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            >
              <option value="">Выберите клиента</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Услуга *</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            >
              <option value="">Выберите услугу</option>
              {groupedServices.map((g) => (
                <optgroup key={g.category.id} label={g.category.name}>
                  {g.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration} мин, {s.price} ₽)</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Мастер *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            >
              <option value="">Выберите мастера</option>
              {employees.filter((e) => e.status === 'working').map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            >
              <option value="pending">Ожидает</option>
              <option value="confirmed">Подтверждено</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Отменено</option>
              <option value="no-show">Не пришел</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Время *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={15}
              step={15}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
            />
          </div>
        </div>

        {availabilityMsg && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm">
            <i className="fas fa-exclamation-triangle mr-2" />{availabilityMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">
            Отмена
          </button>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            {appointment ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
