import apiClient from '../client';
import type { Appointment, Payment } from '../../types';

export const appointmentsApi = {
  getAll: () =>
    apiClient.get<Appointment[]>('/appointments').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  create: (data: Partial<Appointment>) =>
    apiClient.post<Appointment>('/appointments', data).then((r) => r.data),

  update: (id: number, data: Partial<Appointment>) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/appointments/${id}`).then((r) => r.data),
};

export const paymentsApi = {
  getAll: () =>
    apiClient.get<Payment[]>('/payments').then((r) => r.data),

  create: (data: Partial<Payment>) =>
    apiClient.post<Payment>('/payments', data).then((r) => r.data),

  update: (id: number, data: Partial<Payment>) =>
    apiClient.put<Payment>(`/payments/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/payments/${id}`).then((r) => r.data),
};
