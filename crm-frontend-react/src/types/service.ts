export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface Service {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  duration: number;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface PriceHistory {
  id: number;
  serviceId: number;
  oldPrice: number;
  newPrice: number;
  changeDate: string;
  reason?: string;
  changedBy?: string;
}
