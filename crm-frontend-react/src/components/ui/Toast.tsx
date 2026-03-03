import { useUiStore } from '../../stores/uiStore';
import type { ToastType } from '../../stores/uiStore';

const icons: Record<ToastType, string> = {
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-circle',
  info: 'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle',
};

const colors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-400 text-green-700',
  error: 'bg-red-50 border-red-400 text-red-700',
  info: 'bg-blue-50 border-blue-400 text-blue-700',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-72 ${colors[toast.type]}`}
        >
          <i className={icons[toast.type]} />
          <span className="flex-1 text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
}
