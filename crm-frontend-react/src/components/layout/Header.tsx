import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/dateUtils';
import apiClient from '../../api/client';

const roleLabels: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  master: 'Мастер',
};

const roleColors: Record<string, string> = {
  owner: 'bg-red-100 text-red-700',
  admin: 'bg-blue-100 text-blue-700',
  master: 'bg-green-100 text-green-700',
};

export default function Header() {
  const { user, logout } = useAuthStore();

  const handleResetData = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) return;
    try {
      await apiClient.post('/reset');
      alert('База данных сброшена!');
      window.location.reload();
    } catch {
      alert('Ошибка сброса данных');
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-spa text-4xl text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                BeautySalon
              </h1>
              <p className="text-sm text-gray-500">Информационная система</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{formatDate(new Date(), 'long')}</span>
            {user?.role === 'owner' && (
              <button
                onClick={handleResetData}
                className="text-sm px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                <i className="fas fa-sync-alt mr-2" />Сбросить данные
              </button>
            )}
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  <i className="fas fa-user-circle mr-1" />
                  {user.employeeName || user.username}
                  <span className={`text-xs ${roleColors[user.role] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full ml-1`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </span>
                <button
                  onClick={() => { if (confirm('Выйти из системы?')) logout(); }}
                  className="text-sm px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                  title="Выйти"
                >
                  <i className="fas fa-sign-out-alt" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
