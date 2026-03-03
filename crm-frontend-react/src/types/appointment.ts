export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: number;
  clientId: number;
  employeeId: number;
  serviceId: number;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  totalPrice?: number;
  source?: string;
}

export interface Payment {
  id: number;
  appointmentId: number;
  amount: number;
  date: string;
  method: 'cash' | 'card';
  status: 'pending' | 'completed';
}
