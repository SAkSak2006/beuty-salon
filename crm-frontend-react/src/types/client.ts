export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  discount?: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  registrationDate: string;
  notes?: string;
  source?: string;
  telegramId?: string;
}
