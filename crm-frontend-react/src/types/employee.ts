export type SkillLevel = 'junior' | 'middle' | 'senior';
export type EmployeeStatus = 'working' | 'vacation' | 'dismissed';

export interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  email?: string;
  photo?: string;
  hireDate: string;
  salary: number;
  commission: number;
  skillLevel: SkillLevel;
  status: EmployeeStatus;
}

export interface Schedule {
  id: number;
  employeeId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface CompetencyMatrix {
  id: number;
  employeeId: number;
  serviceId: number;
  canPerform: boolean;
  skillLevel: SkillLevel;
  customDuration?: number;
}

export interface Vacation {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
  createdAt?: string;
}
