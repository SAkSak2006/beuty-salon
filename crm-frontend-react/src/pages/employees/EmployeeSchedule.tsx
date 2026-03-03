import { useState } from 'react';
import type { Employee, Schedule } from '../../types';
import { getDayName } from '../../utils/dateUtils';

interface EmployeeScheduleProps {
  employees: Employee[];
  schedules: Schedule[];
  onSaveSchedule: (data: Partial<Schedule>) => void;
  onApplyTemplate: (employeeId: number, template: '5/2' | '2/2') => void;
}

export default function EmployeeSchedule({ employees, schedules, onSaveSchedule, onApplyTemplate }: EmployeeScheduleProps) {
  const [editingCell, setEditingCell] = useState<{ empId: number; day: number } | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const workingEmployees = employees.filter((e) => e.status === 'working');
  const days = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

  const getSchedule = (empId: number, day: number) =>
    schedules.find((s) => s.employeeId === empId && s.dayOfWeek === day);

  const handleSave = (empId: number, day: number) => {
    const existing = getSchedule(empId, day);
    onSaveSchedule({
      id: existing?.id,
      employeeId: empId,
      dayOfWeek: day,
      startTime,
      endTime,
      isWorkingDay: true,
    });
    setEditingCell(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Сотрудник</th>
            {days.map((d) => (
              <th key={d} className="px-3 py-3 text-center text-sm font-medium text-gray-500">{getDayName(d).slice(0, 2)}</th>
            ))}
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">Шаблон</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {workingEmployees.map((emp) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-sm text-gray-800">{emp.name}</td>
              {days.map((day) => {
                const sched = getSchedule(emp.id, day);
                const isEditing = editingCell?.empId === emp.id && editingCell?.day === day;

                return (
                  <td key={day} className="px-1 py-2 text-center">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                          className="w-20 text-xs px-1 py-0.5 border rounded" />
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                          className="w-20 text-xs px-1 py-0.5 border rounded" />
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleSave(emp.id, day)} className="text-green-500 text-xs"><i className="fas fa-check" /></button>
                          <button onClick={() => setEditingCell(null)} className="text-red-500 text-xs"><i className="fas fa-times" /></button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (sched) {
                            setStartTime(sched.startTime); setEndTime(sched.endTime);
                          }
                          setEditingCell({ empId: emp.id, day });
                        }}
                        className={`w-full px-1 py-2 rounded text-xs ${
                          sched?.isWorkingDay
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {sched?.isWorkingDay ? `${sched.startTime}-${sched.endTime}` : 'Вых'}
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-center">
                <div className="flex gap-1 justify-center">
                  <button onClick={() => onApplyTemplate(emp.id, '5/2')}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">5/2</button>
                  <button onClick={() => onApplyTemplate(emp.id, '2/2')}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">2/2</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
