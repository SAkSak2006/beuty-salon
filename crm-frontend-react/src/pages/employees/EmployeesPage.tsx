import { useState, useEffect } from 'react';
import { employeesApi, servicesApi, serviceCategoriesApi, appointmentsApi } from '../../api';
import { scheduleApi, competencyApi, vacationsApi } from '../../api/endpoints/schedule';
import { useUiStore } from '../../stores/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TabBar from '../../components/ui/TabBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmployeeCards from './EmployeeCards';
import EmployeeSchedule from './EmployeeSchedule';
import CompetencyMatrix from './CompetencyMatrix';
import EmployeeModal from './EmployeeModal';
import VacationManager from './VacationManager';
import type {
  Employee, Service, ServiceCategory, Appointment,
  Schedule, CompetencyMatrix as CM, Vacation,
} from '../../types';

const tabs = [
  { key: 'cards', label: 'Карточки', icon: 'fas fa-id-card' },
  { key: 'schedule', label: 'Расписание', icon: 'fas fa-calendar-alt' },
  { key: 'competency', label: 'Компетенции', icon: 'fas fa-star' },
];

export default function EmployeesPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cards');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [matrix, setMatrix] = useState<CM[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [vacationOpen, setVacationOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [emps, svcs, cats, appts, scheds, mat, vacs] = await Promise.all([
        employeesApi.getAll(), servicesApi.getAll(), serviceCategoriesApi.getAll(),
        appointmentsApi.getAll(), scheduleApi.getAll(), competencyApi.getAll(), vacationsApi.getAll(),
      ]);
      setEmployees(emps); setServices(svcs); setCategories(cats);
      setAppointments(appts); setSchedules(scheds); setMatrix(mat); setVacations(vacs);
    } catch { addToast('error', 'Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    try {
      if (data.id) {
        await employeesApi.update(data.id, data);
        addToast('success', 'Сотрудник обновлён');
      } else {
        await employeesApi.create(data);
        addToast('success', 'Сотрудник создан');
      }
      loadData();
    } catch { addToast('error', 'Ошибка сохранения'); }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    try {
      await employeesApi.delete(deleteTarget.id);
      addToast('success', 'Сотрудник удалён');
      setDeleteTarget(null);
      loadData();
    } catch { addToast('error', 'Ошибка удаления'); }
  };

  const handleSaveSchedule = async (data: Partial<Schedule>) => {
    try {
      if (data.id) {
        await scheduleApi.update(data.id, data);
      } else {
        await scheduleApi.create(data);
      }
      loadData();
    } catch { addToast('error', 'Ошибка сохранения расписания'); }
  };

  const handleApplyTemplate = async (employeeId: number, template: '5/2' | '2/2') => {
    try {
      const days = template === '5/2'
        ? [
            { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 3, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 4, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 5, isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 6, isWorkingDay: false, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 0, isWorkingDay: false, startTime: '09:00', endTime: '18:00' },
          ]
        : [
            { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 3, isWorkingDay: false, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 4, isWorkingDay: false, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 5, isWorkingDay: true, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 6, isWorkingDay: true, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 0, isWorkingDay: false, startTime: '09:00', endTime: '21:00' },
          ];

      for (const day of days) {
        const existing = schedules.find((s) => s.employeeId === employeeId && s.dayOfWeek === day.dayOfWeek);
        if (existing) {
          await scheduleApi.update(existing.id, { ...day, employeeId });
        } else {
          await scheduleApi.create({ ...day, employeeId });
        }
      }
      addToast('success', `Шаблон ${template} применён`);
      loadData();
    } catch { addToast('error', 'Ошибка применения шаблона'); }
  };

  const handleToggleCompetency = async (employeeId: number, serviceId: number, current: CM | undefined) => {
    try {
      if (current) {
        await competencyApi.update(current.id, { ...current, canPerform: !current.canPerform });
      } else {
        await competencyApi.create({ employeeId, serviceId, canPerform: true, skillLevel: 'middle' });
      }
      loadData();
    } catch { addToast('error', 'Ошибка обновления компетенции'); }
  };

  const handleSaveVacation = async (data: Partial<Vacation>) => {
    try {
      await vacationsApi.create(data);
      addToast('success', 'Отпуск добавлен');
      loadData();
    } catch { addToast('error', 'Ошибка'); }
  };

  const handleDeleteVacation = async (id: number) => {
    try {
      await vacationsApi.delete(id);
      loadData();
    } catch { addToast('error', 'Ошибка удаления'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-user-tie text-pink-500 mr-3" />Сотрудники
          </h1>
          <p className="text-gray-500 mt-1">Управление персоналом салона</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVacationOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i className="fas fa-umbrella-beach mr-2" />Отпуска
          </button>
          <button onClick={() => { setEditingEmployee(null); setModalOpen(true); }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            <i className="fas fa-plus mr-2" />Новый сотрудник
          </button>
        </div>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'cards' && (
        <EmployeeCards employees={employees} appointments={appointments} services={services}
          onEdit={(emp) => { setEditingEmployee(emp); setModalOpen(true); }} onDelete={setDeleteTarget} />
      )}
      {activeTab === 'schedule' && (
        <EmployeeSchedule employees={employees} schedules={schedules}
          onSaveSchedule={handleSaveSchedule} onApplyTemplate={handleApplyTemplate} />
      )}
      {activeTab === 'competency' && (
        <CompetencyMatrix employees={employees} services={services} categories={categories}
          matrix={matrix} onToggle={handleToggleCompetency} />
      )}

      <EmployeeModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSaveEmployee} employee={editingEmployee} />
      <VacationManager isOpen={vacationOpen} onClose={() => setVacationOpen(false)}
        employees={employees} vacations={vacations}
        onSave={handleSaveVacation} onDelete={handleDeleteVacation} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Удалить сотрудника"
        message={`Вы уверены, что хотите удалить сотрудника «${deleteTarget?.name}»?`}
        onConfirm={handleDeleteEmployee} onCancel={() => setDeleteTarget(null)} confirmText="Удалить" danger />
    </div>
  );
}
