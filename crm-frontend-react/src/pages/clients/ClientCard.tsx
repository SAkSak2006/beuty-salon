import Modal from '../../components/ui/Modal';
import type { Client, Appointment, Service, Employee } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

interface ClientCardProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  appointments: Appointment[];
  services: Service[];
  employees: Employee[];
}

export default function ClientCard({ isOpen, onClose, client, appointments, services, employees }: ClientCardProps) {
  if (!client) return null;

  const clientAppointments = appointments
    .filter((a) => a.clientId === client.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    confirmed: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Завершено',
    confirmed: 'Подтверждено',
    pending: 'Ожидает',
    cancelled: 'Отменено',
    'no-show': 'Не пришел',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Карточка клиента: ${client.name}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{client.totalVisits}</p>
            <p className="text-xs text-gray-500">Визитов</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(client.totalSpent)}</p>
            <p className="text-xs text-gray-500">Потрачено</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{client.discount || 0}%</p>
            <p className="text-xs text-gray-500">Скидка</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-pink-600">
              {client.totalVisits > 0 ? formatCurrency(client.totalSpent / client.totalVisits) : '—'}
            </p>
            <p className="text-xs text-gray-500">Средний чек</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Телефон:</span> <span className="font-medium">{client.phone}</span></div>
          {client.email && <div><span className="text-gray-500">Email:</span> <span className="font-medium">{client.email}</span></div>}
          {client.birthdate && <div><span className="text-gray-500">День рождения:</span> <span className="font-medium">{formatDate(client.birthdate)}</span></div>}
          <div><span className="text-gray-500">Регистрация:</span> <span className="font-medium">{formatDate(client.registrationDate)}</span></div>
          {client.lastVisit && <div><span className="text-gray-500">Последний визит:</span> <span className="font-medium">{formatDate(client.lastVisit)}</span></div>}
          {client.source && <div><span className="text-gray-500">Источник:</span> <span className="font-medium">{client.source}</span></div>}
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">История визитов</h4>
          {clientAppointments.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clientAppointments.map((apt) => {
                const svc = services.find((s) => s.id === apt.serviceId);
                const emp = employees.find((e) => e.id === apt.employeeId);
                return (
                  <div key={apt.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <span className="font-medium">{apt.date}</span> {apt.time}
                      </div>
                      <div className="text-sm text-gray-600">{svc?.name} — {emp?.name}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[apt.status] || ''}`}>
                      {statusLabels[apt.status] || apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Нет визитов</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
