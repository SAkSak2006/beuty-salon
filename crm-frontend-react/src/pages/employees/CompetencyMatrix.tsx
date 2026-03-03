import type { Employee, Service, ServiceCategory, CompetencyMatrix as CM } from '../../types';

interface CompetencyMatrixProps {
  employees: Employee[];
  services: Service[];
  categories: ServiceCategory[];
  matrix: CM[];
  onToggle: (employeeId: number, serviceId: number, current: CM | undefined) => void;
}

export default function CompetencyMatrix({ employees, services, categories, matrix, onToggle }: CompetencyMatrixProps) {
  const workingEmployees = employees.filter((e) => e.status === 'working');
  const activeServices = services.filter((s) => s.isActive);

  const getCompetency = (empId: number, svcId: number) =>
    matrix.find((m) => m.employeeId === empId && m.serviceId === svcId);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 sticky left-0 bg-gray-50">Сотрудник</th>
            {activeServices.map((svc) => {
              const cat = categories.find((c) => c.id === svc.categoryId);
              return (
                <th key={svc.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 min-w-[80px]">
                  <div>{svc.name}</div>
                  {cat && <div className="text-xs text-gray-400 font-normal">{cat.name}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {workingEmployees.map((emp) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-sm text-gray-800 sticky left-0 bg-white">{emp.name}</td>
              {activeServices.map((svc) => {
                const comp = getCompetency(emp.id, svc.id);
                return (
                  <td key={svc.id} className="px-2 py-2 text-center">
                    <button
                      onClick={() => onToggle(emp.id, svc.id, comp)}
                      className={`w-8 h-8 rounded-full transition ${
                        comp?.canPerform
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                    >
                      {comp?.canPerform ? <i className="fas fa-check text-xs" /> : <i className="fas fa-minus text-xs" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
