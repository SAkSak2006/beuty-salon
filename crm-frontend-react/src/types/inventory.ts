export interface InventoryCategory {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  supplierId?: number;
  currentStock: number;
  minStock: number;
  unit: string;
  purchasePrice: number;
  expiryDate?: string;
  category?: string;
  quantity?: number;
  minQuantity?: number;
  price?: number;
  supplier?: string;
  lastRestockDate?: string;
  barcode?: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  deliveryDays?: number;
  contactPerson?: string;
  address?: string;
}

export type TransactionType = 'receipt' | 'consumption' | 'adjustment' | 'writeoff' | 'in' | 'out';

export interface InventoryTransaction {
  id: number;
  inventoryId: number;
  type: TransactionType;
  quantity: number;
  date: string;
  reason?: string;
  employeeId?: number;
  notes?: string;
  itemId?: number;
  supplierId?: number;
  price?: number;
}

export interface ServiceMaterial {
  id: number;
  serviceId: number;
  inventoryId: number;
  quantity: number;
  itemId?: number;
  unit?: string;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  items: PurchaseOrderItem[];
  status: 'pending' | 'ordered' | 'received';
  orderDate: string;
  deliveryDate?: string;
  totalAmount?: number;
  date?: string;
  notes?: string;
  createdBy?: number;
}

export interface PurchaseOrderItem {
  inventoryId: number;
  quantity: number;
  price?: number;
}
