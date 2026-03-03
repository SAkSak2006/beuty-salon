import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

const pageAccess: Record<string, Role[]> = {
  dashboard:    ['master', 'admin', 'owner'],
  appointments: ['master', 'admin', 'owner'],
  clients:      ['master', 'admin', 'owner'],
  employees:    ['admin', 'owner'],
  services:     ['master', 'admin', 'owner'],
  reports:      ['admin', 'owner'],
  inventory:    ['admin', 'owner'],
};

export const useRole = () => {
  const user = useAuthStore((s) => s.user);

  const hasRole = (...roles: Role[]) => {
    return !!user && roles.includes(user.role);
  };

  const canAccess = (page: string) => {
    if (!user) return false;
    const allowed = pageAccess[page];
    return allowed ? allowed.includes(user.role) : false;
  };

  return { hasRole, canAccess, role: user?.role };
};
