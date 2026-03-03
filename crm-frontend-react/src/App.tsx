import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import ToastContainer from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import ClientsPage from './pages/clients/ClientsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import ServicesPage from './pages/services/ServicesPage';
import ReportsPage from './pages/reports/ReportsPage';
import InventoryPage from './pages/inventory/InventoryPage';

function RoleGuard({ page, children }: { page: string; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pageAccess: Record<string, string[]> = {
    dashboard:    ['master', 'admin', 'owner'],
    appointments: ['master', 'admin', 'owner'],
    clients:      ['master', 'admin', 'owner'],
    employees:    ['admin', 'owner'],
    services:     ['master', 'admin', 'owner'],
    reports:      ['admin', 'owner'],
    inventory:    ['admin', 'owner'],
  };

  if (!user || !(pageAccess[page]?.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <HashRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<RoleGuard page="dashboard"><DashboardPage /></RoleGuard>} />
          <Route path="/appointments" element={<RoleGuard page="appointments"><AppointmentsPage /></RoleGuard>} />
          <Route path="/clients" element={<RoleGuard page="clients"><ClientsPage /></RoleGuard>} />
          <Route path="/employees" element={<RoleGuard page="employees"><EmployeesPage /></RoleGuard>} />
          <Route path="/services" element={<RoleGuard page="services"><ServicesPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard page="reports"><ReportsPage /></RoleGuard>} />
          <Route path="/inventory" element={<RoleGuard page="inventory"><InventoryPage /></RoleGuard>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
