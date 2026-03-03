/**
 * Toast notification system
 */

const Toast = {
    container: null,

    /**
     * Initialize toast container
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     */
    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} transform translate-x-full opacity-0 transition-all duration-300 ease-out`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        toast.innerHTML = `
            <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md">
                <i class="fas ${icons[type]} text-xl"></i>
                <span class="flex-1">${message}</span>
                <button onclick="Toast.close(this.parentElement.parentElement)" class="text-white hover:text-gray-200 transition">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.close(toast);
            }, duration);
        }

        return toast;
    },

    /**
     * Close toast
     * @param {HTMLElement} toast - Toast element
     */
    close(toast) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Show success toast
     * @param {string} message - Success message
     */
    success(message) {
        return this.show(message, 'success');
    },

    /**
     * Show error toast
     * @param {string} message - Error message
     */
    error(message) {
        return this.show(message, 'error');
    },

    /**
     * Show warning toast
     * @param {string} message - Warning message
     */
    warning(message) {
        return this.show(message, 'warning');
    },

    /**
     * Show info toast
     * @param {string} message - Info message
     */
    info(message) {
        return this.show(message, 'info');
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
    Toast.init();
}
