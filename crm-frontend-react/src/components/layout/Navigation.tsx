import { useLocation, Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import type { Role } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Главная', icon: 'fas fa-home', roles: ['master', 'admin', 'owner'] },
  { path: '/appointments', label: 'Записи', icon: 'fas fa-calendar-check', roles: ['master', 'admin', 'owner'] },
  { path: '/clients', label: 'Клиенты', icon: 'fas fa-users', roles: ['master', 'admin', 'owner'] },
  { path: '/employees', label: 'Сотрудники', icon: 'fas fa-user-tie', roles: ['admin', 'owner'] },
  { path: '/services', label: 'Услуги', icon: 'fas fa-cut', roles: ['master', 'admin', 'owner'] },
  { path: '/reports', label: 'Отчеты', icon: 'fas fa-chart-line', roles: ['admin', 'owner'] },
  { path: '/inventory', label: 'Склад', icon: 'fas fa-box', roles: ['admin', 'owner'] },
];

export default function Navigation() {
  const location = useLocation();
  const { role } = useRole();

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <nav className="bg-white shadow-md sticky top-[88px] z-40">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-2 px-6 py-4 transition border-b-2 ${
                    isActive
                      ? 'text-pink-500 border-pink-500'
                      : 'text-gray-600 border-transparent hover:text-pink-500 hover:bg-pink-50 hover:border-pink-500'
                  }`}
                >
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
