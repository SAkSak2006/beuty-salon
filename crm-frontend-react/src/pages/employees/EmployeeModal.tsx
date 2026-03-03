import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import type { Employee, SkillLevel, EmployeeStatus } from '../../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Employee>) => void;
  employee?: Employee | null;
}

export default function EmployeeModal({ isOpen, onClose, onSave, employee }: EmployeeModalProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState(0);
  const [commission, setCommission] = useState(0);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('middle');
  const [status, setStatus] = useState<EmployeeStatus>('working');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name); setPosition(employee.position); setPhone(employee.phone);
      setEmail(employee.email || ''); setHireDate(employee.hireDate); setSalary(employee.salary);
      setCommission(employee.commission); setSkillLevel(employee.skillLevel); setStatus(employee.status);
      setPhoto(employee.photo || '');
    } else {
      setName(''); setPosition(''); setPhone(''); setEmail('');
      setHireDate(new Date().toISOString().split('T')[0]); setSalary(0);
      setCommission(10); setSkillLevel('middle'); setStatus('working'); setPhoto('');
    }
  }, [employee, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: employee?.id, name, position, phone, email: email || undefined,
      hireDate, salary, commission, skillLevel, status, photo: photo || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Редактировать сотрудника' : 'Новый сотрудник'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <i className="fas fa-user text-3xl text-gray-400" />}
          </div>
          <label className="px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm">
            <i className="fas fa-camera mr-2" />Загрузить фото
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Должность *</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата найма</label>
            <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Оклад (₽)</label>
            <input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} min={0}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комиссия (%)</label>
            <input type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} min={0} max={100}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Уровень</label>
            <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none">
              <option value="working">Работает</option>
              <option value="vacation">В отпуске</option>
              <option value="dismissed">Уволен</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">Отмена</button>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
            {employee ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
