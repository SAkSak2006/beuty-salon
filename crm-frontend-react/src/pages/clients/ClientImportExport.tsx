import type { Client } from '../../types';
import { exportCSV } from '../../utils/exportUtils';

export function exportClientsCSV(clients: Client[]) {
  exportCSV(
    clients.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      birthdate: c.birthdate || '',
      discount: c.discount || 0,
      totalVisits: c.totalVisits,
      totalSpent: c.totalSpent,
      registrationDate: c.registrationDate,
    })),
    'clients',
    {
      name: 'Имя',
      phone: 'Телефон',
      email: 'Email',
      birthdate: 'Дата рождения',
      discount: 'Скидка (%)',
      totalVisits: 'Визиты',
      totalSpent: 'Потрачено',
      registrationDate: 'Дата регистрации',
    }
  );
}

export function parseClientsCSV(text: string): Partial<Client>[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const parts = line.split(';').map((p) => p.trim().replace(/^"|"$/g, ''));
    return {
      name: parts[0] || '',
      phone: parts[1] || '',
      email: parts[2] || undefined,
      birthdate: parts[3] || undefined,
      discount: parts[4] ? Number(parts[4]) : 0,
    };
  }).filter((c) => c.name && c.phone);
}
