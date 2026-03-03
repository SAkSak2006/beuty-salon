import type { Employee, Appointment, Service } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const statusLabels: Record<string, string> = { working: 'Работает', vacation: 'В отпуске', dismissed: 'Уволен' };
const statusColors: Record<string, string> = {
  working: 'bg-green-100 text-green-700', vacation: 'bg-yellow-100 text-yellow-700', dismissed: 'bg-red-100 text-red-700',
};
const levelColors: Record<string, string> = {
  junior: 'bg-blue-100 text-blue-700', middle: 'bg-purple-100 text-purple-700', senior: 'bg-amber-100 text-amber-700',
};

interface EmployeeCardsProps {
  employees: Employee[];
  appointments: Appointment[];
  services: Service[];
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export default function EmployeeCards({ employees, appointments, services, onEdit, onDelete }: EmployeeCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((emp) => {
        const empAppts = appointments.filter((a) => a.employeeId === emp.id && a.status === 'completed');
        const revenue = empAppts.reduce((sum, a) => {
          const svc = services.find((s) => s.id === a.serviceId);
          return sum + (svc?.price || 0);
        }, 0);
        const commissionAmount = Math.round(revenue * emp.commission / 100);

        return (
          <div key={emp.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {emp.photo ? <img src={emp.photo} alt="" className="w-full h-full object-cover" /> : <i className="fas fa-user text-2xl text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{emp.name}</h3>
                <p className="text-sm text-gray-500">{emp.position}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[emp.status]}`}>{statusLabels[emp.status]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[emp.skillLevel]}`}>{emp.skillLevel}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{empAppts.length}</p>
                <p className="text-xs text-gray-500">Записей</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{formatCurrency(revenue)}</p>
                <p className="text-xs text-gray-500">Выручка</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{formatCurrency(emp.salary)}</p>
                <p className="text-xs text-gray-500">Оклад</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{formatCurrency(commissionAmount)}</p>
                <p className="text-xs text-gray-500">Комиссия ({emp.commission}%)</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => onEdit(emp)} className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm">
                <i className="fas fa-edit mr-1" />Редактировать
              </button>
              <button onClick={() => onDelete(emp)} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm">
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
