import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import type { Employee, Vacation } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface VacationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  vacations: Vacation[];
  onSave: (data: Partial<Vacation>) => void;
  onDelete: (id: number) => void;
}

export default function VacationManager({ isOpen, onClose, employees, vacations, onSave, onDelete }: VacationManagerProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Ежегодный');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    onSave({ employeeId: Number(employeeId), startDate, endDate, type, reason: notes || undefined });
    setEmployeeId(''); setStartDate(''); setEndDate(''); setNotes('');
  };

  const sorted = [...vacations].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Управление отпусками" size="lg">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Сотрудник</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} required
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm">
              <option value="">Выберите</option>
              {employees.filter((e) => e.status !== 'dismissed').map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">С</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">По</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:outline-none text-sm">
              <option>Ежегодный</option>
              <option>Больничный</option>
              <option>За свой счёт</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition text-sm">
            <i className="fas fa-plus mr-1" />Добавить
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sorted.map((v) => {
            const emp = employees.find((e) => e.id === v.employeeId);
            return (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-sm">{emp?.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{v.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{formatDate(v.startDate)} — {formatDate(v.endDate)}</span>
                  <button onClick={() => onDelete(v.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash text-xs" /></button>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Нет отпусков</p>}
        </div>
      </div>
    </Modal>
  );
}
