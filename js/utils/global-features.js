/**
 * Global Features - Search, History, Settings
 */

// Global Search
class GlobalSearch {
    constructor() {
        this.searchableData = [];
        this.init();
    }

    init() {
        this.createSearchOverlay();
    }

    createSearchOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'global-search-overlay';
        overlay.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-start justify-center pt-20';
        overlay.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="relative">
                        <input type="text" id="global-search-input"
                               class="w-full px-4 py-3 pl-12 pr-10 border-none bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                               placeholder="Поиск по всей системе (клиенты, услуги, записи, товары...)">
                        <i class="fas fa-search absolute left-4 top-4 text-gray-400"></i>
                        <button onclick="globalSearch.hide()" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="global-search-results" class="max-h-96 overflow-y-auto p-4">
                    <p class="text-gray-500 text-center py-8">Начните вводить для поиска...</p>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
                    <span><kbd class="px-2 py-1 bg-white dark:bg-gray-800 rounded">↑↓</kbd> Навигация</span>
                    <span><kbd class="px-2 py-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> Выбрать</span>
                    <span><kbd class="px-2 py-1 bg-white dark:bg-gray-800 rounded">Esc</kbd> Закрыть</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Setup event listeners
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hide();
        });

        const searchInput = document.getElementById('global-search-input');
        searchInput.addEventListener('input', window.performanceUtils.debounce((e) => {
            this.search(e.target.value);
        }, 300));
    }

    show() {
        const overlay = document.getElementById('global-search-overlay');
        overlay.classList.remove('hidden');
        document.getElementById('global-search-input').focus();
        this.indexSearchableContent();
    }

    hide() {
        const overlay = document.getElementById('global-search-overlay');
        overlay.classList.add('hidden');
        document.getElementById('global-search-input').value = '';
        document.getElementById('global-search-results').innerHTML = '<p class="text-gray-500 text-center py-8">Начните вводить для поиска...</p>';
    }

    indexSearchableContent() {
        if (!window.beautyDB || typeof window.beautyDB.getDatabase !== 'function') {
            console.warn('Database not yet initialized. Search index will be empty.');
            this.searchableData = [];
            return;
        }

        const db = window.beautyDB.getDatabase();
        this.searchableData = [];

        // Index clients
        db.clients.forEach(client => {
            this.searchableData.push({
                type: 'client',
                id: client.id,
                title: client.name,
                subtitle: `${client.phone} • ${client.email}`,
                icon: 'fa-user',
                color: 'text-blue-600',
                action: () => switchPage('clients')
            });
        });

        // Index services
        db.services.forEach(service => {
            this.searchableData.push({
                type: 'service',
                id: service.id,
                title: service.name,
                subtitle: `${service.price} ₽ • ${service.duration} мин`,
                icon: 'fa-cut',
                color: 'text-purple-600',
                action: () => switchPage('services')
            });
        });

        // Index employees
        db.employees.forEach(employee => {
            this.searchableData.push({
                type: 'employee',
                id: employee.id,
                title: employee.name,
                subtitle: employee.specialization,
                icon: 'fa-user-tie',
                color: 'text-green-600',
                action: () => switchPage('employees')
            });
        });

        // Index inventory
        db.inventory.forEach(item => {
            this.searchableData.push({
                type: 'inventory',
                id: item.id,
                title: item.name,
                subtitle: `${item.sku} • Остаток: ${item.currentStock} ${item.unit}`,
                icon: 'fa-box',
                color: 'text-orange-600',
                action: () => switchPage('inventory')
            });
        });

        // Index appointments
        db.appointments.slice(0, 100).forEach(appointment => {
            const client = db.clients.find(c => c.id === appointment.clientId);
            const service = db.services.find(s => s.id === appointment.serviceId);
            if (client && service) {
                this.searchableData.push({
                    type: 'appointment',
                    id: appointment.id,
                    title: `${client.name} - ${service.name}`,
                    subtitle: `${appointment.date} ${appointment.time}`,
                    icon: 'fa-calendar-check',
                    color: 'text-pink-600',
                    action: () => switchPage('appointments')
                });
            }
        });
    }

    search(query) {
        const resultsContainer = document.getElementById('global-search-results');

        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Начните вводить для поиска...</p>';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = this.searchableData.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.subtitle.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Ничего не найдено</p>';
            return;
        }

        resultsContainer.innerHTML = results.map(result => `
            <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex items-center gap-3"
                 onclick="globalSearch.selectResult('${result.type}', ${result.id})">
                <div class="${result.color}">
                    <i class="fas ${result.icon} text-xl"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">${this.highlightMatch(result.title, query)}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${result.subtitle}</p>
                </div>
                <span class="text-xs text-gray-400 uppercase">${this.getTypeLabel(result.type)}</span>
            </div>
        `).join('');
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
    }

    getTypeLabel(type) {
        const labels = {
            client: 'Клиент',
            service: 'Услуга',
            employee: 'Сотрудник',
            inventory: 'Товар',
            appointment: 'Запись'
        };
        return labels[type] || type;
    }

    selectResult(type, id) {
        const result = this.searchableData.find(r => r.type === type && r.id === id);
        if (result && result.action) {
            result.action();
            this.hide();
        }
    }
}

const globalSearch = new GlobalSearch();

// User Activity History
class UserHistory {
    constructor(maxHistory = 100) {
        this.maxHistory = maxHistory;
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('beautysalon_user_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('beautysalon_user_history', JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    add(action, details = {}) {
        this.history.unshift({
            id: Date.now(),
            action,
            details,
            timestamp: new Date().toISOString(),
            page: window.location.hash
        });

        // Keep only last maxHistory items
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        this.saveHistory();
    }

    get(limit = 10) {
        return this.history.slice(0, limit);
    }

    clear() {
        this.history = [];
        this.saveHistory();
    }

    getByAction(action) {
        return this.history.filter(item => item.action === action);
    }

    getByDate(date) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        return this.history.filter(item =>
            item.timestamp.startsWith(dateStr)
        );
    }

    showHistory() {
        const recent = this.get(20);

        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="history-modal">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">История действий</h3>
                        <button onclick="document.getElementById('history-modal').remove()"
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto space-y-2">
                        ${recent.length > 0 ? recent.map(item => `
                            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900 dark:text-white">${this.getActionLabel(item.action)}</p>
                                        ${item.details.name ? `<p class="text-sm text-gray-600 dark:text-gray-400">${item.details.name}</p>` : ''}
                                    </div>
                                    <span class="text-xs text-gray-500">${this.formatTime(item.timestamp)}</span>
                                </div>
                            </div>
                        `).join('') : '<p class="text-center text-gray-500 py-8">История пуста</p>'}
                    </div>

                    <div class="mt-4 flex gap-4">
                        <button onclick="userHistory.clear(); document.getElementById('history-modal').remove(); window.uxEnhancements.toastQueue.show('История очищена', 'success');"
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Очистить историю
                        </button>
                        <button onclick="document.getElementById('history-modal').remove()"
                                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        const existing = document.getElementById('history-modal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', html);
    }

    getActionLabel(action) {
        const labels = {
            'create_client': 'Добавлен клиент',
            'edit_client': 'Изменен клиент',
            'delete_client': 'Удален клиент',
            'create_appointment': 'Создана запись',
            'edit_appointment': 'Изменена запись',
            'delete_appointment': 'Удалена запись',
            'create_service': 'Добавлена услуга',
            'edit_service': 'Изменена услуга',
            'delete_service': 'Удалена услуга',
            'create_employee': 'Добавлен сотрудник',
            'edit_employee': 'Изменен сотрудник',
            'delete_employee': 'Удален сотрудник',
            'add_payment': 'Добавлен платеж',
            'inventory_transaction': 'Операция со складом',
            'page_view': 'Просмотр страницы'
        };
        return labels[action] || action;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        if (days < 7) return `${days} дн назад`;

        return date.toLocaleDateString('ru-RU');
    }
}

const userHistory = new UserHistory();

// User Preferences
class UserPreferences {
    constructor() {
        this.preferences = this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('beautysalon_preferences');
            return saved ? JSON.parse(saved) : this.getDefaults();
        } catch (e) {
            return this.getDefaults();
        }
    }

    getDefaults() {
        return {
            theme: 'light',
            compactView: false,
            itemsPerPage: 25,
            defaultPage: 'dashboard',
            showNotifications: true,
            autoSave: true,
            language: 'ru'
        };
    }

    save() {
        try {
            localStorage.setItem('beautysalon_preferences', JSON.stringify(this.preferences));
        } catch (e) {
            console.error('Failed to save preferences:', e);
        }
    }

    get(key) {
        return this.preferences[key];
    }

    set(key, value) {
        this.preferences[key] = value;
        this.save();
    }

    reset() {
        this.preferences = this.getDefaults();
        this.save();
    }

    showSettings() {
        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="settings-modal">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Настройки</h3>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <label class="text-gray-700 dark:text-gray-300">Компактный вид</label>
                            <input type="checkbox" id="pref-compact" ${this.get('compactView') ? 'checked' : ''}
                                   onchange="userPreferences.set('compactView', this.checked); userPreferences.applyPreferences();"
                                   class="w-12 h-6">
                        </div>

                        <div class="flex justify-between items-center">
                            <label class="text-gray-700 dark:text-gray-300">Уведомления</label>
                            <input type="checkbox" id="pref-notifications" ${this.get('showNotifications') ? 'checked' : ''}
                                   onchange="userPreferences.set('showNotifications', this.checked);"
                                   class="w-12 h-6">
                        </div>

                        <div class="flex justify-between items-center">
                            <label class="text-gray-700 dark:text-gray-300">Автосохранение</label>
                            <input type="checkbox" id="pref-autosave" ${this.get('autoSave') ? 'checked' : ''}
                                   onchange="userPreferences.set('autoSave', this.checked);"
                                   class="w-12 h-6">
                        </div>

                        <div>
                            <label class="text-gray-700 dark:text-gray-300 block mb-2">Элементов на странице</label>
                            <select id="pref-items-per-page"
                                    onchange="userPreferences.set('itemsPerPage', parseInt(this.value));"
                                    class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                <option value="10" ${this.get('itemsPerPage') === 10 ? 'selected' : ''}>10</option>
                                <option value="25" ${this.get('itemsPerPage') === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${this.get('itemsPerPage') === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${this.get('itemsPerPage') === 100 ? 'selected' : ''}>100</option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-4">
                        <button onclick="userPreferences.reset(); document.getElementById('settings-modal').remove(); window.uxEnhancements.toastQueue.show('Настройки сброшены', 'success');"
                                class="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400">
                            Сбросить
                        </button>
                        <button onclick="document.getElementById('settings-modal').remove();"
                                class="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        const existing = document.getElementById('settings-modal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', html);
    }

    applyPreferences() {
        if (this.get('compactView')) {
            document.body.classList.add('compact-view');
        } else {
            document.body.classList.remove('compact-view');
        }
    }
}

const userPreferences = new UserPreferences();

// Database export/import
const databaseManager = {
    exportDatabase() {
        if (!window.beautyDB || typeof window.beautyDB.getDatabase !== 'function') {
            console.error('Database not available');
            if (window.showToast) window.showToast('База данных недоступна', 'error');
            return;
        }

        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            database: window.beautyDB.getDatabase()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beautysalon-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        if (window.uxEnhancements && window.uxEnhancements.toastQueue) {
            window.uxEnhancements.toastQueue.show('База данных экспортирована', 'success');
        } else if (window.showToast) {
            window.showToast('База данных экспортирована', 'success');
        }
    },

    importDatabase(file) {
        if (!window.beautyDB || typeof window.beautyDB.saveDatabase !== 'function') {
            console.error('Database not available');
            if (window.showToast) window.showToast('База данных недоступна', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.database) {
                    const doImport = () => {
                        window.beautyDB.saveDatabase(data.database);
                        const toast = window.uxEnhancements && window.uxEnhancements.toastQueue ?
                            window.uxEnhancements.toastQueue.show : window.showToast;
                        if (toast) toast('База данных импортирована', 'success');
                        setTimeout(() => location.reload(), 1000);
                    };

                    if (window.uxEnhancements && window.uxEnhancements.confirmDialog) {
                        window.uxEnhancements.confirmDialog(
                            'Импорт заменит все текущие данные. Продолжить?',
                            doImport
                        );
                    } else if (confirm('Импорт заменит все текущие данные. Продолжить?')) {
                        doImport();
                    }
                } else {
                    const toast = window.uxEnhancements && window.uxEnhancements.toastQueue ?
                        window.uxEnhancements.toastQueue.show : window.showToast;
                    if (toast) toast('Неверный формат файла', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                const toast = window.uxEnhancements && window.uxEnhancements.toastQueue ?
                    window.uxEnhancements.toastQueue.show : window.showToast;
                if (toast) toast('Ошибка импорта', 'error');
            }
        };

        reader.readAsText(file);
    },

    showExportImport() {
        const html = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="export-import-modal">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Экспорт/Импорт базы данных</h3>

                    <div class="space-y-4">
                        <button onclick="databaseManager.exportDatabase()"
                                class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                            <i class="fas fa-download"></i>
                            Экспортировать базу данных
                        </button>

                        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <input type="file" id="import-file" accept=".json" class="hidden"
                                   onchange="if(this.files[0]) databaseManager.importDatabase(this.files[0]);">
                            <button onclick="document.getElementById('import-file').click()"
                                    class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                <i class="fas fa-upload"></i>
                                Импортировать базу данных
                            </button>
                        </div>

                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <i class="fas fa-info-circle mr-1"></i>
                            Импорт заменит все текущие данные
                        </p>
                    </div>

                    <button onclick="document.getElementById('export-import-modal').remove()"
                            class="mt-6 w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400">
                        Закрыть
                    </button>
                </div>
            </div>
        `;

        const existing = document.getElementById('export-import-modal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', html);
    }
};

// Setup global keyboard shortcuts for new features
if (window.uxEnhancements && window.uxEnhancements.keyboardShortcuts) {
    // Ctrl+K - Global search
    window.uxEnhancements.keyboardShortcuts.register('Ctrl+K', () => {
        globalSearch.show();
    }, 'Глобальный поиск');

    // Ctrl+H - Show history
    window.uxEnhancements.keyboardShortcuts.register('Ctrl+H', () => {
        userHistory.showHistory();
    }, 'История действий');

    // Ctrl+, - Settings
    window.uxEnhancements.keyboardShortcuts.register('Ctrl+,', () => {
        userPreferences.showSettings();
    }, 'Настройки');
}

// Export global features
window.globalFeatures = {
    globalSearch,
    userHistory,
    userPreferences,
    databaseManager
};
