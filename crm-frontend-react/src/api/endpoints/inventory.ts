import apiClient from '../client';
import type {
  InventoryItem, InventoryCategory, Supplier,
  InventoryTransaction, ServiceMaterial, PurchaseOrder,
} from '../../types';

export const inventoryApi = {
  getAll: () =>
    apiClient.get<InventoryItem[]>('/inventory').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<InventoryItem>(`/inventory/${id}`).then((r) => r.data),

  create: (data: Partial<InventoryItem>) =>
    apiClient.post<InventoryItem>('/inventory', data).then((r) => r.data),

  update: (id: number, data: Partial<InventoryItem>) =>
    apiClient.put<InventoryItem>(`/inventory/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/inventory/${id}`).then((r) => r.data),
};

export const inventoryCategoriesApi = {
  getAll: () =>
    apiClient.get<InventoryCategory[]>('/inventory-categories').then((r) => r.data),

  create: (data: Partial<InventoryCategory>) =>
    apiClient.post<InventoryCategory>('/inventory-categories', data).then((r) => r.data),

  update: (id: number, data: Partial<InventoryCategory>) =>
    apiClient.put<InventoryCategory>(`/inventory-categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/inventory-categories/${id}`).then((r) => r.data),
};

export const suppliersApi = {
  getAll: () =>
    apiClient.get<Supplier[]>('/suppliers').then((r) => r.data),

  create: (data: Partial<Supplier>) =>
    apiClient.post<Supplier>('/suppliers', data).then((r) => r.data),

  update: (id: number, data: Partial<Supplier>) =>
    apiClient.put<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/suppliers/${id}`).then((r) => r.data),
};

export const inventoryTransactionsApi = {
  getAll: () =>
    apiClient.get<InventoryTransaction[]>('/inventory-transactions').then((r) => r.data),

  create: (data: Partial<InventoryTransaction>) =>
    apiClient.post<InventoryTransaction>('/inventory-transactions', data).then((r) => r.data),
};

export const serviceMaterialsApi = {
  getAll: () =>
    apiClient.get<ServiceMaterial[]>('/service-materials').then((r) => r.data),

  create: (data: Partial<ServiceMaterial>) =>
    apiClient.post<ServiceMaterial>('/service-materials', data).then((r) => r.data),

  update: (id: number, data: Partial<ServiceMaterial>) =>
    apiClient.put<ServiceMaterial>(`/service-materials/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/service-materials/${id}`).then((r) => r.data),
};

export const purchaseOrdersApi = {
  getAll: () =>
    apiClient.get<PurchaseOrder[]>('/purchase-orders').then((r) => r.data),

  create: (data: Partial<PurchaseOrder>) =>
    apiClient.post<PurchaseOrder>('/purchase-orders', data).then((r) => r.data),

  update: (id: number, data: Partial<PurchaseOrder>) =>
    apiClient.put<PurchaseOrder>(`/purchase-orders/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/purchase-orders/${id}`).then((r) => r.data),
};
