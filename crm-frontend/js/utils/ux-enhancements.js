/**
 * UX Enhancement utilities
 */

// Loading indicator
const LoadingIndicator = {
    show(message = 'Загрузка...') {
        const existing = document.getElementById('global-loader');
        if (existing) return;

        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
        loader.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl">
                <div class="loader mb-4"></div>
                <p class="text-gray-700 font-medium">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);

        // Add loader CSS if not present
        if (!document.getElementById('loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                .loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #ec4899;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    },

    hide() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }
};

// Skeleton screen generator
function createSkeleton(type = 'card', count = 1) {
    const skeletons = {
        card: `
            <div class="skeleton-card bg-white p-6 rounded-lg shadow-md animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
        `,
        table: `
            <div class="skeleton-table bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div class="h-8 bg-gray-200 rounded mb-4"></div>
                <div class="space-y-3">
                    <div class="h-4 bg-gray-200 rounded"></div>
                    <div class="h-4 bg-gray-200 rounded"></div>
                    <div class="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        `,
        list: `
            <div class="skeleton-list animate-pulse">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        `
    };

    return Array(count).fill(skeletons[type] || skeletons.card).join('');
}

// Keyboard shortcuts manager
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            const handler = this.shortcuts.get(key);

            if (handler) {
                e.preventDefault();
                handler(e);
            }
        });
    }

    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        parts.push(e.key.toUpperCase());
        return parts.join('+');
    }

    register(keyCombo, handler, description = '') {
        this.shortcuts.set(keyCombo, handler);

        // Store description for help dialog
        if (!this.descriptions) this.descriptions = [];
        this.descriptions.push({ keyCombo, description });
    }

    unregister(keyCombo) {
        this.shortcuts.delete(keyCombo);
    }

    showHelp() {
        const shortcuts = this.descriptions || [];
        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="keyboard-help">
                <div class="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold mb-4">Горячие клавиши</h3>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${shortcuts.map(s => `
                            <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                <span class="text-gray-700">${s.description}</span>
                                <kbd class="px-2 py-1 bg-gray-200 rounded text-sm font-mono">${s.keyCombo}</kbd>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="document.getElementById('keyboard-help').remove()"
                            class="mt-4 w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                        Закрыть
                    </button>
                </div>
            </div>
        `;

        const existing = document.getElementById('keyboard-help');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', html);
    }
}

const keyboardShortcuts = new KeyboardShortcuts();

// Smooth scroll utility
function smoothScrollTo(element, duration = 500) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Breadcrumbs navigation
class Breadcrumbs {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.path = [];
    }

    add(label, href) {
        this.path.push({ label, href });
        this.render();
    }

    set(path) {
        this.path = path;
        this.render();
    }

    clear() {
        this.path = [];
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.path.map((item, index) => `
            <span class="inline-flex items-center">
                ${index > 0 ? '<i class="fas fa-chevron-right mx-2 text-gray-400 text-sm"></i>' : ''}
                ${index === this.path.length - 1 ?
                    `<span class="text-gray-600">${item.label}</span>` :
                    `<a href="${item.href}" class="text-pink-600 hover:text-pink-700">${item.label}</a>`
                }
            </span>
        `).join('');
    }
}

// Toast notifications with queue
class ToastQueue {
    constructor() {
        this.queue = [];
        this.showing = false;
    }

    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        if (!this.showing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.showing = false;
            return;
        }

        this.showing = true;
        const { message, type, duration } = this.queue.shift();

        // Use existing showNotification if available
        if (typeof showNotification === 'function') {
            showNotification(type, message);
        } else {
            console.log(`[${type}]`, message);
        }

        await new Promise(resolve => setTimeout(resolve, duration));
        this.processQueue();
    }
}

const toastQueue = new ToastQueue();

// Undo/Redo manager
class UndoRedoManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }

    execute(action, data) {
        // Remove any redo history
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new action
        this.history.push({
            action,
            data: JSON.parse(JSON.stringify(data)),
            timestamp: Date.now()
        });

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo() {
        if (this.currentIndex < 0) return null;

        const action = this.history[this.currentIndex];
        this.currentIndex--;
        return action;
    }

    redo() {
        if (this.currentIndex >= this.history.length - 1) return null;

        this.currentIndex++;
        return this.history[this.currentIndex];
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }

    getHistory() {
        return this.history;
    }
}

const undoRedoManager = new UndoRedoManager();

// Form auto-save
class AutoSave {
    constructor(formId, saveCallback, interval = 30000) {
        this.form = document.getElementById(formId);
        this.saveCallback = saveCallback;
        this.interval = interval;
        this.timeoutId = null;
        this.lastSaved = null;

        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('input', () => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => this.save(), this.interval);
        });
    }

    save() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        this.saveCallback(data);
        this.lastSaved = new Date();

        toastQueue.show('Изменения сохранены', 'success', 2000);
    }

    forceSave() {
        clearTimeout(this.timeoutId);
        this.save();
    }
}

// Confirmation dialog
function confirmDialog(message, onConfirm, onCancel) {
    const html = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="confirm-dialog">
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                <h3 class="text-xl font-bold mb-4">Подтверждение</h3>
                <p class="text-gray-700 mb-6">${message}</p>
                <div class="flex gap-4">
                    <button id="confirm-yes" class="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                        Да
                    </button>
                    <button id="confirm-no" class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                        Нет
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const dialog = document.getElementById('confirm-dialog');

    document.getElementById('confirm-yes').addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });

    document.getElementById('confirm-no').addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
}

// Progress bar
class ProgressBar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.value = 0;
    }

    set(value) {
        this.value = Math.min(100, Math.max(0, value));
        this.render();
    }

    increment(amount = 1) {
        this.set(this.value + amount);
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div class="bg-gradient-to-r from-pink-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                     style="width: ${this.value}%"></div>
            </div>
            <p class="text-sm text-gray-600 mt-1 text-center">${this.value}%</p>
        `;
    }

    reset() {
        this.value = 0;
        this.render();
    }
}

// Contextual help tooltips
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip fixed bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg z-[9999]';
            tooltip.textContent = element.dataset.tooltip;
            tooltip.id = 'active-tooltip';

            document.body.appendChild(tooltip);

            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        });

        element.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('active-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// Copy to clipboard with feedback
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        toastQueue.show('Скопировано в буфер обмена', 'success', 2000);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        toastQueue.show('Не удалось скопировать', 'error', 2000);
        return false;
    }
}

// Initialize default keyboard shortcuts
function initDefaultKeyboardShortcuts() {
    // Ctrl+K - Quick search
    keyboardShortcuts.register('Ctrl+K', () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Поиск"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }, 'Быстрый поиск');

    // Escape - Close modal
    keyboardShortcuts.register('ESCAPE', () => {
        const modal = document.querySelector('[id$="-modal"]:not(.hidden), #confirm-dialog, #keyboard-help');
        if (modal) {
            if (typeof closeModal === 'function') {
                closeModal();
            } else {
                modal.remove();
            }
        }
    }, 'Закрыть модальное окно');

    // Ctrl+/ or ? - Show help
    keyboardShortcuts.register('Ctrl+/', () => {
        keyboardShortcuts.showHelp();
    }, 'Показать справку');

    keyboardShortcuts.register('Shift+/', () => {
        keyboardShortcuts.showHelp();
    }, 'Показать справку');

    // Ctrl+Z - Undo
    keyboardShortcuts.register('Ctrl+Z', () => {
        if (undoRedoManager.canUndo()) {
            const action = undoRedoManager.undo();
            toastQueue.show('Действие отменено', 'info', 2000);
        }
    }, 'Отменить действие');

    // Ctrl+Y - Redo
    keyboardShortcuts.register('Ctrl+Y', () => {
        if (undoRedoManager.canRedo()) {
            const action = undoRedoManager.redo();
            toastQueue.show('Действие повторено', 'info', 2000);
        }
    }, 'Повторить действие');
}

// Export UX utilities
window.uxEnhancements = {
    LoadingIndicator,
    createSkeleton,
    keyboardShortcuts,
    smoothScrollTo,
    Breadcrumbs,
    toastQueue,
    undoRedoManager,
    AutoSave,
    confirmDialog,
    ProgressBar,
    initTooltips,
    copyToClipboard,
    initDefaultKeyboardShortcuts
};

// Auto-initialize keyboard shortcuts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDefaultKeyboardShortcuts);
} else {
    initDefaultKeyboardShortcuts();
}
