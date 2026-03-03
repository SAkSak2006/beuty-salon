export interface DashboardData {
  revenue: number;
  activeClients: number;
  averageCheck: number;
  masterLoad: number;
  newClients: number;
  revenueChange?: number;
  clientsChange?: number;
}

export interface RevenueData {
  labels: string[];
  data: number[];
}

export interface TopService {
  name: string;
  count: number;
  revenue: number;
}

export interface TodayLoad {
  employeeId: number;
  employeeName: string;
  appointments: number;
  totalSlots: number;
  loadPercent: number;
}

export interface UpcomingAppointment {
  id: number;
  clientName: string;
  serviceName: string;
  employeeName: string;
  date: string;
  time: string;
  status: string;
}

export interface Birthday {
  id: number;
  name: string;
  phone: string;
  birthdate: string;
  daysUntil: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}
