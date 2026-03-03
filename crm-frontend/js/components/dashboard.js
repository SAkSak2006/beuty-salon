/**
 * Dashboard component with advanced KPI cards and analytics
 */

const Dashboard = {
    charts: {},

    /**
     * Render dashboard page
     */
    render() {
        // Get date ranges
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        // Get analytics data
        const clientMetrics = Database.getClientMetrics(startDate, today);
        const topServices = Database.getTopServices(5, startDate, today);
        const employeeLoad = Database.getTodayEmployeeLoad();
        const upcomingAppointments = Database.getUpcomingAppointments(5);
        const birthdays = Database.getBirthdaysThisWeek();
        const lowStockItems = Database.getLowStockItems();
        const revenueData = Database.getRevenueByPeriod(startDate, today, 'day');

        // Calculate KPIs
        const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
        const avgCheck = clientMetrics.avgCheck;
        const newClientsCount = clientMetrics.newClients;

        // Calculate average employee load
        const avgLoad = employeeLoad.length > 0
            ? Math.round(employeeLoad.reduce((sum, e) => sum + e.loadPercentage, 0) / employeeLoad.length)
            : 0;

        return `
            <div class="space-y-6 dashboard-page">
                <!-- Header with Quick Actions -->
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-home text-primary mr-3"></i>
                        Главная панель
                    </h1>
                    <div class="flex gap-2">
                        <a href="#appointments" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-pink-600 transition">
                            <i class="fas fa-plus mr-2"></i>Новая запись
                        </a>
                        <a href="#reports" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-purple-700 transition">
                            <i class="fas fa-chart-bar mr-2"></i>Отчеты
                        </a>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <!-- Revenue (30 days) -->
                    <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white kpi-card">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                <i class="fas fa-ruble-sign text-2xl"></i>
                            </div>
                            <span class="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">30 дней</span>
                        </div>
                        <p class="text-3xl font-bold mb-1">${totalRevenue.toLocaleString('ru-RU')}</p>
                        <p class="text-sm opacity-90">Выручка (₽)</p>
                    </div>

                    <!-- Active Clients -->
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white kpi-card">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                <i class="fas fa-users text-2xl"></i>
                            </div>
                            <span class="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">30 дней</span>
                        </div>
                        <p class="text-3xl font-bold mb-1">${clientMetrics.activeClients}</p>
                        <p class="text-sm opacity-90">Активных клиентов</p>
                    </div>

                    <!-- Average Check -->
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white kpi-card">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                <i class="fas fa-receipt text-2xl"></i>
                            </div>
                            <span class="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">30 дней</span>
                        </div>
                        <p class="text-3xl font-bold mb-1">${avgCheck.toLocaleString('ru-RU')}</p>
                        <p class="text-sm opacity-90">Средний чек (₽)</p>
                    </div>

                    <!-- Master Load Today -->
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white kpi-card">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                <i class="fas fa-tasks text-2xl"></i>
                            </div>
                            <span class="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">Сегодня</span>
                        </div>
                        <p class="text-3xl font-bold mb-1">${avgLoad}%</p>
                        <p class="text-sm opacity-90">Загрузка мастеров</p>
                    </div>

                    <!-- New Clients -->
                    <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white kpi-card">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-plus text-2xl"></i>
                            </div>
                            <span class="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">30 дней</span>
                        </div>
                        <p class="text-3xl font-bold mb-1">${newClientsCount}</p>
                        <p class="text-sm opacity-90">Новых клиентов</p>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Revenue Chart (30 days) -->
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-chart-line text-primary mr-2"></i>
                                Выручка за 30 дней
                            </h3>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-calendar mr-1"></i>
                                ${thirtyDaysAgo.toLocaleDateString('ru-RU')} - ${new Date().toLocaleDateString('ru-RU')}
                            </div>
                        </div>
                        <canvas id="revenueChart" style="max-height: 300px;"></canvas>
                    </div>

                    <!-- Top 5 Services (Bar Chart) -->
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-star text-yellow-500 mr-2"></i>
                                ТОП-5 популярных услуг
                            </h3>
                            <div class="text-sm text-gray-500">За 30 дней</div>
                        </div>
                        <canvas id="servicesChart" style="max-height: 300px;"></canvas>
                    </div>
                </div>

                <!-- Master Load Today -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-user-clock text-green-600 mr-2"></i>
                        Загрузка мастеров сегодня
                    </h3>
                    <div class="space-y-4">
                        ${employeeLoad.length > 0 ? employeeLoad.map(emp => `
                            <div class="flex items-center gap-4">
                                <div class="w-32 flex-shrink-0">
                                    <p class="font-medium text-gray-800 text-sm">${emp.employeeName}</p>
                                    <p class="text-xs text-gray-500">${emp.appointmentsCount} записей</p>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                            <div class="h-full rounded-full transition-all ${
                                                emp.loadPercentage >= 80 ? 'bg-red-500' :
                                                emp.loadPercentage >= 60 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }" style="width: ${emp.loadPercentage}%"></div>
                                        </div>
                                        <span class="text-sm font-semibold text-gray-700 w-12 text-right">${emp.loadPercentage}%</span>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">Нет данных о загрузке</p>'}
                    </div>
                </div>

                <!-- Upcoming Appointments & Birthdays -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Upcoming Appointments -->
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-clock text-primary mr-2"></i>
                                Предстоящие записи
                            </h3>
                            <a href="#appointments" class="text-sm text-primary hover:text-pink-600">
                                Все записи <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                        <div class="space-y-3">
                            ${upcomingAppointments.length > 0 ? upcomingAppointments.map(apt => `
                                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:shadow-md transition border-l-4 border-primary">
                                    <div class="flex-1">
                                        <p class="font-semibold text-gray-800">${apt.clientName}</p>
                                        <p class="text-sm text-gray-600 mt-1">
                                            <i class="fas fa-cut text-primary mr-1"></i>${apt.serviceName}
                                        </p>
                                        <p class="text-xs text-gray-500 mt-1">
                                            <i class="fas fa-user text-purple-500 mr-1"></i>${apt.employeeName}
                                        </p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-semibold text-primary">${DateUtils.formatDate(apt.date)}</p>
                                        <p class="text-sm text-gray-600 mt-1">
                                            <i class="far fa-clock mr-1"></i>${apt.time}
                                        </p>
                                        <p class="text-xs text-green-600 font-medium mt-1">${apt.price.toLocaleString('ru-RU')} ₽</p>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-center py-8">Нет предстоящих записей</p>'}
                        </div>
                    </div>

                    <!-- Client Birthdays This Week -->
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-birthday-cake text-pink-500 mr-2"></i>
                                Дни рождения на этой неделе
                            </h3>
                            <span class="text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-medium">
                                ${birthdays.length}
                            </span>
                        </div>
                        <div class="space-y-3">
                            ${birthdays.length > 0 ? birthdays.map(client => `
                                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg hover:shadow-md transition">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white">
                                            <i class="fas fa-gift"></i>
                                        </div>
                                        <div>
                                            <p class="font-semibold text-gray-800">${client.name}</p>
                                            <p class="text-sm text-gray-600">
                                                <i class="fas fa-birthday-cake text-pink-500 mr-1"></i>
                                                ${client.age} ${this.getAgeWord(client.age)}
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">
                                                <i class="fas fa-phone mr-1"></i>${client.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-medium ${client.daysUntilBirthday === 0 ? 'text-pink-600' : 'text-gray-600'}">
                                            ${client.daysUntilBirthday === 0 ? 'Сегодня!' :
                                              client.daysUntilBirthday === 1 ? 'Завтра' :
                                              `Через ${client.daysUntilBirthday} ${this.getDaysWord(client.daysUntilBirthday)}`}
                                        </p>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-center py-8">На этой неделе дней рождения нет</p>'}
                        </div>
                    </div>
                </div>

                <!-- Alerts and Notifications -->
                ${lowStockItems.length > 0 || clientMetrics.churnRate > 20 ? `
                <div class="bg-white rounded-xl shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                        Важные уведомления
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${lowStockItems.length > 0 ? `
                            <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-box text-red-500 text-xl mt-1"></i>
                                    <div class="flex-1">
                                        <p class="font-semibold text-red-800 mb-2">Низкий запас товаров</p>
                                        <p class="text-sm text-red-600 mb-3">
                                            ${lowStockItems.length} товаров требуют пополнения
                                        </p>
                                        <ul class="space-y-1">
                                            ${lowStockItems.slice(0, 3).map(item => `
                                                <li class="text-sm text-red-700 flex items-center gap-2">
                                                    <i class="fas fa-circle text-xs"></i>
                                                    <span>${item.name}</span>
                                                    <span class="text-red-800 font-medium">(${item.quantity} ${item.unit})</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                        <a href="#inventory" class="inline-block mt-3 text-sm text-red-700 hover:text-red-900 font-medium">
                                            Перейти к складу <i class="fas fa-arrow-right ml-1"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${clientMetrics.churnRate > 20 ? `
                            <div class="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-user-minus text-yellow-600 text-xl mt-1"></i>
                                    <div class="flex-1">
                                        <p class="font-semibold text-yellow-800 mb-2">Высокий отток клиентов</p>
                                        <p class="text-sm text-yellow-700 mb-3">
                                            Показатель оттока: <span class="font-bold">${clientMetrics.churnRate}%</span>
                                        </p>
                                        <p class="text-sm text-yellow-700">
                                            Рекомендуем запустить программу лояльности для возврата клиентов
                                        </p>
                                        <a href="#reports" class="inline-block mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium">
                                            Подробный анализ <i class="fas fa-arrow-right ml-1"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Quick Statistics Summary -->
                <div class="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg p-6 text-white">
                    <h3 class="text-xl font-bold mb-6">
                        <i class="fas fa-chart-bar mr-2"></i>
                        Сводка за 30 дней
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div class="text-center">
                            <p class="text-4xl font-bold mb-2">${clientMetrics.totalClients}</p>
                            <p class="text-sm opacity-90">Всего клиентов</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold mb-2">${clientMetrics.repeatRate}%</p>
                            <p class="text-sm opacity-90">Повторных визитов</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold mb-2">${clientMetrics.avgLTV.toLocaleString('ru-RU')}</p>
                            <p class="text-sm opacity-90">Средний LTV (₽)</p>
                        </div>
                        <div class="text-center">
                            <p class="text-4xl font-bold mb-2">${Database.getAll('services').length}</p>
                            <p class="text-sm opacity-90">Услуг в каталоге</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Helper: Get age word with correct declension
     */
    getAgeWord(age) {
        const lastDigit = age % 10;
        const lastTwoDigits = age % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'лет';
        }
        if (lastDigit === 1) {
            return 'год';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'года';
        }
        return 'лет';
    },

    /**
     * Helper: Get days word with correct declension
     */
    getDaysWord(days) {
        const lastDigit = days % 10;
        const lastTwoDigits = days % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'дней';
        }
        if (lastDigit === 1) {
            return 'день';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'дня';
        }
        return 'дней';
    },

    /**
     * Called after rendering
     */
    afterRender() {
        this.initCharts();
    },

    /**
     * Initialize all charts
     */
    initCharts() {
        this.createRevenueChart();
        this.createServicesChart();
    },

    /**
     * Create revenue line chart for 30 days
     */
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        // Get revenue data for last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const revenueData = Database.getRevenueByPeriod(startDate, endDate, 'day');

        const labels = revenueData.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        });

        const data = revenueData.map(day => day.revenue);

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выручка (₽)',
                    data: data,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return 'Выручка: ' + context.parsed.y.toLocaleString('ru-RU') + ' ₽';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('ru-RU') + ' ₽';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    /**
     * Create top services bar chart
     */
    createServicesChart() {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (this.charts.services) {
            this.charts.services.destroy();
        }

        // Get top 5 services
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const topServices = Database.getTopServices(5, startDate, today);

        const labels = topServices.map(service => service.name);
        const data = topServices.map(service => service.revenue);

        this.charts.services = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выручка (₽)',
                    data: data,
                    backgroundColor: [
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(244, 114, 182, 0.8)',
                        'rgba(167, 139, 250, 0.8)',
                        'rgba(251, 113, 133, 0.8)'
                    ],
                    borderColor: [
                        '#ec4899',
                        '#8b5cf6',
                        '#f472b6',
                        '#a78bfa',
                        '#fb7185'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return 'Выручка: ' + context.parsed.x.toLocaleString('ru-RU') + ' ₽';
                            },
                            afterLabel: function(context) {
                                const service = topServices[context.dataIndex];
                                return 'Записей: ' + service.count;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('ru-RU') + ' ₽';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};
