import apiClient from '../client';

export const reportsApi = {
  dashboard: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/dashboard', { params }).then((r) => r.data),

  revenue: (params?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    apiClient.get('/reports/revenue', { params }).then((r) => r.data),

  topServices: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    apiClient.get('/reports/top-services', { params }).then((r) => r.data),

  todayLoad: () =>
    apiClient.get('/reports/today-load').then((r) => r.data),

  upcomingAppointments: (params?: { limit?: number }) =>
    apiClient.get('/reports/upcoming-appointments', { params }).then((r) => r.data),

  birthdays: (params?: { days?: number }) =>
    apiClient.get('/reports/birthdays', { params }).then((r) => r.data),

  clientMetrics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/client-metrics', { params }).then((r) => r.data),

  employeeEfficiency: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/employee-efficiency', { params }).then((r) => r.data),

  serviceStats: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/service-stats', { params }).then((r) => r.data),

  financialSummary: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/financial-summary', { params }).then((r) => r.data),
};
