import apiClient from '../client';
import type { Service, ServiceCategory, PriceHistory } from '../../types';

export const servicesApi = {
  getAll: () =>
    apiClient.get<Service[]>('/services').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Service>(`/services/${id}`).then((r) => r.data),

  create: (data: Partial<Service>) =>
    apiClient.post<Service>('/services', data).then((r) => r.data),

  update: (id: number, data: Partial<Service>) =>
    apiClient.put<Service>(`/services/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/services/${id}`).then((r) => r.data),
};

export const serviceCategoriesApi = {
  getAll: () =>
    apiClient.get<ServiceCategory[]>('/service-categories').then((r) => r.data),

  create: (data: Partial<ServiceCategory>) =>
    apiClient.post<ServiceCategory>('/service-categories', data).then((r) => r.data),

  update: (id: number, data: Partial<ServiceCategory>) =>
    apiClient.put<ServiceCategory>(`/service-categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/service-categories/${id}`).then((r) => r.data),
};

export const priceHistoryApi = {
  getAll: () =>
    apiClient.get<PriceHistory[]>('/price-history').then((r) => r.data),

  getByService: (serviceId: number) =>
    apiClient.get<PriceHistory[]>('/price-history', { params: { serviceId } }).then((r) => r.data),

  create: (data: Partial<PriceHistory>) =>
    apiClient.post<PriceHistory>('/price-history', data).then((r) => r.data),
};
