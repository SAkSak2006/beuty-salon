import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Ошибка входа');
      } else {
        setError('Ошибка входа');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="login-card rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <i className="fas fa-spa text-5xl text-pink-500 mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            BeautySalon
          </h1>
          <p className="text-gray-500 mt-2">Информационная система</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-user mr-2" />Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition"
              placeholder="Введите логин"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-lock mr-2" />Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition pr-12"
                placeholder="Введите пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70"
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin mr-2" />Вход...</>
            ) : (
              <><i className="fas fa-sign-in-alt mr-2" />Войти</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; 2024 BeautySalon Information System
        </p>
      </div>
    </div>
  );
}
