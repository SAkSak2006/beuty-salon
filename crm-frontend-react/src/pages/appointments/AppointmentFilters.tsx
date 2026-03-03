import type { Employee, AppointmentStatus } from '../../types';

const statusConfig: Record<AppointmentStatus, { color: string; label: string }> = {
  confirmed: { color: '#10b981', label: 'Подтверждено' },
  pending: { color: '#f59e0b', label: 'Ожидает' },
  completed: { color: '#3b82f6', label: 'Завершено' },
  cancelled: { color: '#ef4444', label: 'Отменено' },
  'no-show': { color: '#6b7280', label: 'Не пришел' },
};

interface AppointmentFiltersProps {
  employees: Employee[];
  selectedEmployees: number[];
  selectedStatuses: AppointmentStatus[];
  onToggleEmployee: (id: number) => void;
  onToggleStatus: (status: AppointmentStatus) => void;
  onToday: () => void;
  onAddAppointment: () => void;
}

export default function AppointmentFilters({
  employees, selectedEmployees, selectedStatuses,
  onToggleEmployee, onToggleStatus, onToday, onAddAppointment,
}: AppointmentFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          <i className="fas fa-bolt text-yellow-500 mr-2" />Быстрые действия
        </h3>
        <div className="space-y-2">
          <button onClick={onToday} className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm">
            <i className="fas fa-calendar-day mr-2" />Сегодня
          </button>
          <button onClick={onAddAppointment} className="w-full px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition text-sm">
            <i className="fas fa-plus mr-2" />Новая запись
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          <i className="fas fa-user-tie text-purple-500 mr-2" />Мастера
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.id)}
                onChange={() => onToggleEmployee(emp.id)}
                className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{emp.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          <i className="fas fa-filter text-green-500 mr-2" />Статусы
        </h3>
        <div className="space-y-1">
          {(Object.entries(statusConfig) as [AppointmentStatus, { color: string; label: string }][]).map(([status, cfg]) => (
            <label key={status} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status)}
                onChange={() => onToggleStatus(status)}
                className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
              />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-sm text-gray-700">{cfg.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export { statusConfig };
