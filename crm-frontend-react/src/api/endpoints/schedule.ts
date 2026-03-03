import apiClient from '../client';
import type { Schedule, CompetencyMatrix, Vacation } from '../../types';

export const scheduleApi = {
  getAll: () =>
    apiClient.get<Schedule[]>('/schedule').then((r) => r.data),

  getByEmployee: (employeeId: number) =>
    apiClient.get<Schedule[]>('/schedule', { params: { employeeId } }).then((r) => r.data),

  create: (data: Partial<Schedule>) =>
    apiClient.post<Schedule>('/schedule', data).then((r) => r.data),

  update: (id: number, data: Partial<Schedule>) =>
    apiClient.put<Schedule>(`/schedule/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/schedule/${id}`).then((r) => r.data),
};

export const competencyApi = {
  getAll: () =>
    apiClient.get<CompetencyMatrix[]>('/competency-matrix').then((r) => r.data),

  create: (data: Partial<CompetencyMatrix>) =>
    apiClient.post<CompetencyMatrix>('/competency-matrix', data).then((r) => r.data),

  update: (id: number, data: Partial<CompetencyMatrix>) =>
    apiClient.put<CompetencyMatrix>(`/competency-matrix/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/competency-matrix/${id}`).then((r) => r.data),
};

export const vacationsApi = {
  getAll: () =>
    apiClient.get<Vacation[]>('/vacations').then((r) => r.data),

  create: (data: Partial<Vacation>) =>
    apiClient.post<Vacation>('/vacations', data).then((r) => r.data),

  update: (id: number, data: Partial<Vacation>) =>
    apiClient.put<Vacation>(`/vacations/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/vacations/${id}`).then((r) => r.data),
};
