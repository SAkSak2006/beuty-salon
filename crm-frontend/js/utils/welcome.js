/**
 * Welcome Screen and Onboarding System
 * Shows a landing page on first visit with tour and demo data loading
 */

class WelcomeScreen {
    constructor() {
        this.hasVisited = localStorage.getItem('hasVisited');
        this.tourStep = 0;
        this.tourSteps = [
            {
                title: '👋 Добро пожаловать в BeautySalon!',
                description: 'Современная информационная система для управления салоном красоты',
                icon: '🌸',
                features: [
                    'Управление записями и клиентами',
                    'Складской учет и аналитика',
                    'Отчеты и статистика',
                    'Управление сотрудниками'
                ]
            },
            {
                title: '📅 Удобное управление записями',
                description: 'Интерактивный календарь с автоматическим расчетом стоимости',
                icon: '📆',
                image: 'appointments'
            },
            {
                title: '👥 База клиентов',
                description: 'Полная информация о клиентах, история посещений, программа лояльности',
                icon: '💎',
                image: 'clients'
            },
            {
                title: '📊 Аналитика и отчеты',
                description: 'Детальная статистика, финансовые отчеты, RFM-анализ',
                icon: '📈',
                image: 'reports'
            },
            {
                title: '⌨️ Горячие клавиши',
                description: 'Работайте быстрее с помощью клавиатурных сокращений',
                icon: '⚡',
                shortcuts: [
                    { keys: 'Ctrl + K', action: 'Глобальный поиск' },
                    { keys: 'Ctrl + N', action: 'Новая запись' },
                    { keys: 'Ctrl + H', action: 'История действий' },
                    { keys: 'Ctrl + /', action: 'Справка' }
                ]
            },
            {
                title: '🚀 Готовы начать?',
                description: 'Выберите, как вы хотите начать работу',
                icon: '✨',
                options: true
            }
        ];
    }

    show() {
        if (!this.hasVisited) {
            this.createWelcomeModal();
        }
    }

    createWelcomeModal() {
        const modal = document.createElement('div');
        modal.id = 'welcome-screen';
        modal.className = 'fixed inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center z-50 p-4';
        modal.style.animation = 'fadeIn 0.5s ease-out';

        modal.innerHTML = this.getStepContent(0);
        document.body.appendChild(modal);

        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            .float-animation {
                animation: float 3s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }

    getStepContent(step) {
        const stepData = this.tourSteps[step];
        const progress = ((step + 1) / this.tourSteps.length) * 100;

        let content = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden" style="animation: slideInUp 0.5s ease-out">
                <!-- Progress Bar -->
                <div class="h-2 bg-gray-200">
                    <div class="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300" style="width: ${progress}%"></div>
                </div>

                <!-- Content -->
                <div class="p-8 md:p-12">
                    <div class="text-center mb-8">
                        <div class="text-7xl mb-4 float-animation">${stepData.icon}</div>
                        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">${stepData.title}</h1>
                        <p class="text-lg text-gray-600">${stepData.description}</p>
                    </div>
        `;

        // Features list
        if (stepData.features) {
            content += `
                <div class="grid md:grid-cols-2 gap-4 mb-8">
                    ${stepData.features.map(feature => `
                        <div class="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                            <i class="fas fa-check-circle text-pink-500 text-xl"></i>
                            <span class="text-gray-700">${feature}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Shortcuts
        if (stepData.shortcuts) {
            content += `
                <div class="grid md:grid-cols-2 gap-4 mb-8">
                    ${stepData.shortcuts.map(shortcut => `
                        <div class="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                            <kbd class="px-3 py-2 bg-white border-2 border-gray-300 rounded shadow-sm font-mono text-sm">
                                ${shortcut.keys}
                            </kbd>
                            <span class="text-gray-600 text-sm">${shortcut.action}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Options for final step
        if (stepData.options) {
            content += `
                <div class="grid md:grid-cols-3 gap-4 mb-8">
                    <button onclick="welcomeScreen.loadDemoData()"
                            class="p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition transform hover:scale-105 shadow-lg">
                        <i class="fas fa-database text-3xl mb-3"></i>
                        <h3 class="font-bold mb-2">С демо-данными</h3>
                        <p class="text-sm opacity-90">Рекомендуется для ознакомления</p>
                    </button>

                    <button onclick="welcomeScreen.startEmpty()"
                            class="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition transform hover:scale-105 shadow-lg">
                        <i class="fas fa-file text-3xl mb-3"></i>
                        <h3 class="font-bold mb-2">С чистого листа</h3>
                        <p class="text-sm opacity-90">Начать с пустой базы</p>
                    </button>

                    <button onclick="welcomeScreen.importData()"
                            class="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition transform hover:scale-105 shadow-lg">
                        <i class="fas fa-upload text-3xl mb-3"></i>
                        <h3 class="font-bold mb-2">Импортировать</h3>
                        <p class="text-sm opacity-90">Загрузить свои данные</p>
                    </button>
                </div>
            `;
        }

        // Navigation buttons
        content += `
                    <div class="flex justify-between items-center mt-8">
                        ${step > 0 ? `
                            <button onclick="welcomeScreen.previousStep()"
                                    class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                                <i class="fas fa-arrow-left mr-2"></i> Назад
                            </button>
                        ` : '<div></div>'}

                        ${!stepData.options ? `
                            <button onclick="welcomeScreen.nextStep()"
                                    class="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition">
                                ${step === this.tourSteps.length - 2 ? 'Начать' : 'Далее'}
                                <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        ` : `
                            <button onclick="welcomeScreen.skip()"
                                    class="px-4 py-2 text-gray-500 hover:text-gray-700 transition text-sm">
                                Пропустить тур
                            </button>
                        `}
                    </div>

                    <!-- Step indicators -->
                    <div class="flex justify-center gap-2 mt-6">
                        ${this.tourSteps.map((_, index) => `
                            <div class="w-2 h-2 rounded-full ${index === step ? 'bg-pink-500 w-8' : 'bg-gray-300'} transition-all"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    nextStep() {
        this.tourStep++;
        if (this.tourStep < this.tourSteps.length) {
            this.updateContent();
        }
    }

    previousStep() {
        if (this.tourStep > 0) {
            this.tourStep--;
            this.updateContent();
        }
    }

    updateContent() {
        const modal = document.getElementById('welcome-screen');
        if (modal) {
            modal.innerHTML = this.getStepContent(this.tourStep);
        }
    }

    loadDemoData() {
        // Demo data will be loaded automatically by database.js if no data exists
        this.markAsVisited();
        this.close();

        if (window.showToast) {
            window.showToast('✅ Демо-данные загружены! Добро пожаловать!', 'success');
        }

        // Ensure demo data is loaded
        if (window.beautyDB) {
            const db = window.beautyDB.getDatabase();
            if (db.clients.length === 0) {
                // Demo data should be loaded by database.js
                window.location.reload();
            }
        }

        // Show quick tour of features
        setTimeout(() => {
            if (window.showToast) {
                window.showToast('💡 Используйте Ctrl+K для быстрого поиска', 'info');
            }
        }, 2000);
    }

    startEmpty() {
        // Clear any existing data
        if (window.beautyDB) {
            // Keep the database empty
            const emptyDB = {
                clients: [],
                appointments: [],
                services: [],
                employees: [],
                inventory: [],
                transactions: [],
                suppliers: []
            };
            localStorage.setItem('beautyDB', JSON.stringify(emptyDB));
        }

        this.markAsVisited();
        this.close();

        if (window.showToast) {
            window.showToast('✅ База данных готова! Начните добавлять свои данные.', 'success');
        }

        window.location.reload();
    }

    importData() {
        this.close();
        this.markAsVisited();

        // Trigger import
        if (window.databaseManager) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    window.databaseManager.importDatabase(file);
                }
            };
            input.click();
        }
    }

    skip() {
        this.markAsVisited();
        this.close();

        if (window.showToast) {
            window.showToast('Добро пожаловать в BeautySalon!', 'info');
        }
    }

    markAsVisited() {
        localStorage.setItem('hasVisited', 'true');
        localStorage.setItem('firstVisitDate', new Date().toISOString());
    }

    close() {
        const modal = document.getElementById('welcome-screen');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }

        // Add fade out animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Method to manually show tour again
    showTour() {
        this.tourStep = 0;
        this.createWelcomeModal();
    }
}

// Quick Start Guide (can be shown anytime)
class QuickStartGuide {
    constructor() {
        this.tips = [
            {
                title: 'Добавление клиента',
                steps: [
                    'Перейдите в раздел "Клиенты"',
                    'Нажмите "Добавить клиента" или Ctrl+N',
                    'Заполните контактную информацию',
                    'Сохраните клиента'
                ],
                icon: '👥'
            },
            {
                title: 'Создание записи',
                steps: [
                    'Откройте раздел "Записи"',
                    'Выберите дату и время',
                    'Выберите клиента и услугу',
                    'Назначьте мастера',
                    'Сохраните запись'
                ],
                icon: '📅'
            },
            {
                title: 'Просмотр отчетов',
                steps: [
                    'Перейдите в раздел "Отчеты"',
                    'Выберите тип отчета',
                    'Настройте период',
                    'Экспортируйте при необходимости'
                ],
                icon: '📊'
            },
            {
                title: 'Управление складом',
                steps: [
                    'Откройте раздел "Склад"',
                    'Просмотрите остатки товаров',
                    'Добавьте новые поступления',
                    'Отслеживайте расход материалов'
                ],
                icon: '📦'
            }
        ];
    }

    show() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-rocket text-pink-500 mr-3"></i>
                        Быстрый старт
                    </h2>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700 transition">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    ${this.tips.map(tip => `
                        <div class="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                            <div class="text-4xl mb-4">${tip.icon}</div>
                            <h3 class="text-xl font-bold text-gray-800 mb-4">${tip.title}</h3>
                            <ol class="space-y-2">
                                ${tip.steps.map((step, index) => `
                                    <li class="flex items-start gap-3">
                                        <span class="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            ${index + 1}
                                        </span>
                                        <span class="text-gray-600 text-sm">${step}</span>
                                    </li>
                                `).join('')}
                            </ol>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <h3 class="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-lightbulb"></i>
                        Полезные советы
                    </h3>
                    <ul class="space-y-2 text-sm text-yellow-700">
                        <li>• Используйте <kbd class="px-2 py-1 bg-white border rounded">Ctrl+K</kbd> для быстрого поиска</li>
                        <li>• Горячие клавиши помогут работать быстрее - нажмите <kbd class="px-2 py-1 bg-white border rounded">Ctrl+/</kbd></li>
                        <li>• Регулярно создавайте резервные копии данных</li>
                        <li>• Переключайтесь между светлой и темной темой для комфорта</li>
                    </ul>
                </div>

                <div class="mt-6 text-center">
                    <button onclick="this.closest('.fixed').remove()"
                            class="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition">
                        Понятно, спасибо!
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize Welcome Screen
let welcomeScreen;
let quickStartGuide;

function initWelcome() {
    welcomeScreen = new WelcomeScreen();
    quickStartGuide = new QuickStartGuide();

    // Show welcome screen on first visit
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => welcomeScreen.show(), 500);
        });
    } else {
        setTimeout(() => welcomeScreen.show(), 500);
    }

    // Add to window for global access
    window.welcomeScreen = welcomeScreen;
    window.quickStartGuide = quickStartGuide;
}

// Auto-initialize
initWelcome();
