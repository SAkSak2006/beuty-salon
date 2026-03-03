import apiClient from '../client';
import type { Client } from '../../types';

export const clientsApi = {
  getAll: () =>
    apiClient.get<Client[]>('/clients').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Client>(`/clients/${id}`).then((r) => r.data),

  create: (data: Partial<Client>) =>
    apiClient.post<Client>('/clients', data).then((r) => r.data),

  update: (id: number, data: Partial<Client>) =>
    apiClient.put<Client>(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/clients/${id}`).then((r) => r.data),
};
