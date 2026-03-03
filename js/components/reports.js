/**
 * Reports component with comprehensive analytics
 */

const Reports = {
    charts: {},
    currentTab: 'financial',
    dateRange: '30days',
    startDate: null,
    endDate: null,

    /**
     * Render reports page
     */
    render() {
        this.calculateDateRange();

        return `
            <div class="space-y-6 reports-page">
                <!-- Header -->
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-chart-line text-primary mr-3"></i>
                        Отчеты и аналитика
                    </h1>
                    <div class="flex gap-2">
                        <button onclick="Reports.exportToCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-file-excel mr-2"></i>Excel
                        </button>
                        <button onclick="Reports.exportToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            <i class="fas fa-file-pdf mr-2"></i>PDF
                        </button>
                        <button onclick="window.print()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                            <i class="fas fa-print mr-2"></i>Печать
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Период</label>
                            <select id="date-range" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" onchange="Reports.changeDateRange()">
                                <option value="7days">Последние 7 дней</option>
                                <option value="30days" selected>Последние 30 дней</option>
                                <option value="3months">Последние 3 месяца</option>
                                <option value="6months">Последние 6 месяцев</option>
                                <option value="year">Последний год</option>
                                <option value="custom">Произвольный период</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">С даты</label>
                            <input type="date" id="start-date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" onchange="Reports.changeDateRange()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">По дату</label>
                            <input type="date" id="end-date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" onchange="Reports.changeDateRange()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Группировка</label>
                            <select id="grouping" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" onchange="Reports.updateCharts()">
                                <option value="day">По дням</option>
                                <option value="week">По неделям</option>
                                <option value="month">По месяцам</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Report Tabs -->
                <div class="bg-white rounded-xl shadow-md">
                    <div class="border-b border-gray-200">
                        <div class="flex overflow-x-auto">
                            <button onclick="Reports.switchTab('financial')" class="tab-btn ${this.currentTab === 'financial' ? 'active' : ''}" data-tab="financial">
                                <i class="fas fa-ruble-sign mr-2"></i>Финансы
                            </button>
                            <button onclick="Reports.switchTab('clients')" class="tab-btn ${this.currentTab === 'clients' ? 'active' : ''}" data-tab="clients">
                                <i class="fas fa-users mr-2"></i>Клиенты
                            </button>
                            <button onclick="Reports.switchTab('services')" class="tab-btn ${this.currentTab === 'services' ? 'active' : ''}" data-tab="services">
                                <i class="fas fa-cut mr-2"></i>Услуги
                            </button>
                            <button onclick="Reports.switchTab('personnel')" class="tab-btn ${this.currentTab === 'personnel' ? 'active' : ''}" data-tab="personnel">
                                <i class="fas fa-user-tie mr-2"></i>Персонал
                            </button>
                            <button onclick="Reports.switchTab('marketing')" class="tab-btn ${this.currentTab === 'marketing' ? 'active' : ''}" data-tab="marketing">
                                <i class="fas fa-bullhorn mr-2"></i>Маркетинг
                            </button>
                        </div>
                    </div>

                    <!-- Tab Content -->
                    <div class="p-6">
                        <div id="financial-tab" class="tab-content ${this.currentTab === 'financial' ? 'active' : ''}">
                            ${this.renderFinancialTab()}
                        </div>
                        <div id="clients-tab" class="tab-content ${this.currentTab === 'clients' ? 'active' : ''}">
                            ${this.renderClientsTab()}
                        </div>
                        <div id="services-tab" class="tab-content ${this.currentTab === 'services' ? 'active' : ''}">
                            ${this.renderServicesTab()}
                        </div>
                        <div id="personnel-tab" class="tab-content ${this.currentTab === 'personnel' ? 'active' : ''}">
                            ${this.renderPersonnelTab()}
                        </div>
                        <div id="marketing-tab" class="tab-content ${this.currentTab === 'marketing' ? 'active' : ''}">
                            ${this.renderMarketingTab()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Calculate date range based on selected period
     */
    calculateDateRange() {
        const today = new Date();
        const endDate = today;
        let startDate = new Date();

        switch (this.dateRange) {
            case '7days':
                startDate.setDate(today.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(today.getDate() - 30);
                break;
            case '3months':
                startDate.setMonth(today.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(today.getMonth() - 6);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate.setDate(today.getDate() - 30);
        }

        this.startDate = startDate.toISOString().split('T')[0];
        this.endDate = endDate.toISOString().split('T')[0];
    },

    /**
     * Render financial reports tab
     */
    renderFinancialTab() {
        const revenueData = Database.getRevenueByPeriod(this.startDate, this.endDate, 'day');
        const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
        const employees = Database.getAll('employees');
        const totalSalaries = employees.reduce((sum, emp) => sum + emp.salary, 0);
        const profit = totalRevenue - totalSalaries;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;

        const payments = Database.getPaymentsByDateRange(this.startDate, this.endDate);
        const cashPayments = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
        const cardPayments = payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);

        const forecast = Database.getRevenueForecasting(30);

        return `
            <!-- Financial KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Общая выручка</p>
                    <p class="text-3xl font-bold">${totalRevenue.toLocaleString('ru-RU')} ₽</p>
                    <p class="text-xs opacity-75 mt-2">За выбранный период</p>
                </div>
                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Расходы (ФОТ)</p>
                    <p class="text-3xl font-bold">${totalSalaries.toLocaleString('ru-RU')} ₽</p>
                    <p class="text-xs opacity-75 mt-2">Фонд оплаты труда</p>
                </div>
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Прибыль</p>
                    <p class="text-3xl font-bold">${profit.toLocaleString('ru-RU')} ₽</p>
                    <p class="text-xs opacity-75 mt-2">${profit >= 0 ? 'Положительная' : 'Убыток'}</p>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Маржа</p>
                    <p class="text-3xl font-bold">${profitMargin.toFixed(1)}%</p>
                    <p class="text-xs opacity-75 mt-2">Рентабельность</p>
                </div>
            </div>

            <!-- Revenue Chart & Forecast -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-line text-primary mr-2"></i>
                        Динамика выручки
                    </h3>
                    <canvas id="revenue-trend-chart" style="max-height: 300px;"></canvas>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-crystal-ball text-purple-500 mr-2"></i>
                        Прогноз выручки (30 дней)
                    </h3>
                    <canvas id="revenue-forecast-chart" style="max-height: 300px;"></canvas>
                    <div class="mt-4 grid grid-cols-3 gap-3">
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <p class="text-xs text-gray-600">Тренд</p>
                            <p class="text-lg font-bold ${forecast.trend === 'growing' ? 'text-green-600' : forecast.trend === 'declining' ? 'text-red-600' : 'text-gray-600'}">
                                ${forecast.trend === 'growing' ? '↗ Рост' : forecast.trend === 'declining' ? '↘ Спад' : '→ Стабильно'}
                            </p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <p class="text-xs text-gray-600">Средний доход/день</p>
                            <p class="text-lg font-bold text-blue-600">${forecast.avgDailyRevenue.toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <p class="text-xs text-gray-600">Прогноз/месяц</p>
                            <p class="text-lg font-bold text-purple-600">${(forecast.avgDailyRevenue * 30).toLocaleString('ru-RU')} ₽</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Methods -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-credit-card text-blue-500 mr-2"></i>
                    Способы оплаты
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <canvas id="payment-methods-chart" style="max-height: 250px;"></canvas>
                    </div>
                    <div class="flex flex-col justify-center space-y-4">
                        <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Наличные</p>
                                    <p class="text-2xl font-bold text-green-600">${cashPayments.toLocaleString('ru-RU')} ₽</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-bold text-green-600">${totalRevenue > 0 ? ((cashPayments / totalRevenue) * 100).toFixed(1) : 0}%</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                    <i class="fas fa-credit-card"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Безналичные</p>
                                    <p class="text-2xl font-bold text-blue-600">${cardPayments.toLocaleString('ru-RU')} ₽</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-bold text-blue-600">${totalRevenue > 0 ? ((cardPayments / totalRevenue) * 100).toFixed(1) : 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render clients analysis tab
     */
    renderClientsTab() {
        const clientMetrics = Database.getClientMetrics(this.startDate, this.endDate);
        const rfmAnalysis = Database.getRFMAnalysis();
        const cohortData = Database.getCohortAnalysis(6);

        return `
            <!-- Client KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Всего клиентов</p>
                    <p class="text-3xl font-bold">${clientMetrics.totalClients}</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Новых клиентов</p>
                    <p class="text-3xl font-bold">${clientMetrics.newClients}</p>
                </div>
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Средний чек</p>
                    <p class="text-3xl font-bold">${clientMetrics.avgCheck.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Средний LTV</p>
                    <p class="text-3xl font-bold">${clientMetrics.avgLTV.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Отток (Churn)</p>
                    <p class="text-3xl font-bold">${clientMetrics.churnRate}%</p>
                </div>
            </div>

            <!-- RFM Analysis -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-users-cog text-primary mr-2"></i>
                    RFM-сегментация клиентов
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <canvas id="rfm-segments-chart" style="max-height: 300px;"></canvas>
                    </div>
                    <div class="col-span-2">
                        <div class="grid grid-cols-2 gap-4">
                            ${rfmAnalysis.segmentCounts.map(seg => {
                                const colors = {
                                    'VIP': 'from-yellow-500 to-yellow-600',
                                    'Лояльные': 'from-green-500 to-green-600',
                                    'Новички': 'from-blue-500 to-blue-600',
                                    'Средние': 'from-gray-500 to-gray-600',
                                    'Требуют внимания': 'from-orange-500 to-orange-600',
                                    'Потерянные': 'from-red-500 to-red-600'
                                };
                                return `
                                    <div class="bg-gradient-to-br ${colors[seg.segment]} rounded-lg p-4 text-white">
                                        <p class="text-sm opacity-90">${seg.segment}</p>
                                        <p class="text-2xl font-bold">${seg.count} клиентов</p>
                                        <p class="text-xs opacity-75 mt-1">Средний LTV: ${seg.avgMonetary.toLocaleString('ru-RU')} ₽</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Клиент</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Сегмент</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Частота</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Потрачено</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">RFM Score</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${rfmAnalysis.clients.slice(0, 10).map(client => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium text-gray-800">${client.clientName}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${
                                            client.segment === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                                            client.segment === 'Лояльные' ? 'bg-green-100 text-green-800' :
                                            client.segment === 'Новички' ? 'bg-blue-100 text-blue-800' :
                                            client.segment === 'Требуют внимания' ? 'bg-orange-100 text-orange-800' :
                                            client.segment === 'Потерянные' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }">
                                            ${client.segment}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-gray-600">${client.frequency} визитов</td>
                                    <td class="px-4 py-3 text-green-600 font-semibold">${client.monetary.toLocaleString('ru-RU')} ₽</td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div class="text-sm font-medium">${client.rfmScore}/15</div>
                                            <div class="flex-1 bg-gray-200 rounded-full h-2">
                                                <div class="bg-primary rounded-full h-2" style="width: ${(client.rfmScore / 15) * 100}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Cohort Analysis -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-chart-area text-blue-500 mr-2"></i>
                    Когортный анализ (удержание клиентов)
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700">Когорта</th>
                                <th class="px-3 py-2 text-left font-semibold text-gray-700">Клиентов</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M0</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M1</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M2</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M3</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M4</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M5</th>
                                <th class="px-3 py-2 text-center font-semibold text-gray-700">M6</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${cohortData.map(cohort => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-3 py-2 font-medium text-gray-800">${cohort.cohort}</td>
                                    <td class="px-3 py-2 text-gray-600">${cohort.totalClients}</td>
                                    ${[0, 1, 2, 3, 4, 5, 6].map(month => {
                                        const retention = cohort.retention[month] || 0;
                                        const bgColor = retention >= 80 ? 'bg-green-100 text-green-800' :
                                                       retention >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                       retention >= 40 ? 'bg-orange-100 text-orange-800' :
                                                       retention > 0 ? 'bg-red-100 text-red-800' :
                                                       'bg-gray-50 text-gray-400';
                                        return `<td class="px-3 py-2 text-center ${bgColor} font-medium">${retention}%</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Render services analysis tab
     */
    renderServicesTab() {
        const abcAnalysis = Database.getABCAnalysis();
        const popularServices = Database.getServicePopularity(this.startDate, this.endDate);

        return `
            <!-- ABC Analysis -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-layer-group text-primary mr-2"></i>
                    ABC-анализ услуг
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <p class="text-sm opacity-90 mb-1">Категория A (80%)</p>
                        <p class="text-3xl font-bold">${abcAnalysis.summary.A.count} услуг</p>
                        <p class="text-sm opacity-90 mt-2">${abcAnalysis.summary.A.revenue.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                        <p class="text-sm opacity-90 mb-1">Категория B (15%)</p>
                        <p class="text-3xl font-bold">${abcAnalysis.summary.B.count} услуг</p>
                        <p class="text-sm opacity-90 mt-2">${abcAnalysis.summary.B.revenue.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                        <p class="text-sm opacity-90 mb-1">Категория C (5%)</p>
                        <p class="text-3xl font-bold">${abcAnalysis.summary.C.count} услуг</p>
                        <p class="text-sm opacity-90 mt-2">${abcAnalysis.summary.C.revenue.toLocaleString('ru-RU')} ₽</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Категория</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Услуга</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Количество</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Выручка</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">% от выручки</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Накопленный %</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${abcAnalysis.services.map(service => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3">
                                        <span class="px-3 py-1 text-xs font-bold rounded-full ${
                                            service.category === 'A' ? 'bg-green-100 text-green-800' :
                                            service.category === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }">
                                            ${service.category}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 font-medium text-gray-800">${service.serviceName}</td>
                                    <td class="px-4 py-3 text-gray-600">${service.count}</td>
                                    <td class="px-4 py-3 text-green-600 font-semibold">${service.revenue.toLocaleString('ru-RU')} ₽</td>
                                    <td class="px-4 py-3 text-gray-600">${service.revenuePercent}%</td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div class="flex-1 bg-gray-200 rounded-full h-2">
                                                <div class="bg-primary rounded-full h-2" style="width: ${service.cumulativePercent}%"></div>
                                            </div>
                                            <span class="text-sm font-medium text-gray-700">${service.cumulativePercent}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Service Popularity -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                    Популярность услуг
                </h3>
                <canvas id="service-popularity-chart" style="max-height: 400px;"></canvas>
            </div>
        `;
    },

    /**
     * Render personnel reports tab
     */
    renderPersonnelTab() {
        const efficiency = Database.getEmployeeEfficiency(this.startDate, this.endDate);

        return `
            <!-- Employee Efficiency -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-users text-primary mr-2"></i>
                    Эффективность сотрудников
                </h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <canvas id="employee-revenue-chart" style="max-height: 300px;"></canvas>
                    <canvas id="employee-efficiency-chart" style="max-height: 300px;"></canvas>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Сотрудник</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Должность</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Записей</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Выручка</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Часов</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">₽/час</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Средний чек</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${efficiency.map(emp => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium text-gray-800">${emp.employeeName}</td>
                                    <td class="px-4 py-3 text-gray-600">${emp.position}</td>
                                    <td class="px-4 py-3 text-gray-600">${emp.appointmentsCount}</td>
                                    <td class="px-4 py-3 text-green-600 font-semibold">${emp.revenue.toLocaleString('ru-RU')} ₽</td>
                                    <td class="px-4 py-3 text-gray-600">${emp.totalHours} ч</td>
                                    <td class="px-4 py-3 text-blue-600 font-semibold">${emp.revenuePerHour.toLocaleString('ru-RU')} ₽</td>
                                    <td class="px-4 py-3 text-purple-600 font-medium">${emp.avgCheck.toLocaleString('ru-RU')} ₽</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Render marketing reports tab
     */
    renderMarketingTab() {
        const appointments = Database.getAppointmentsByDateRange(this.startDate, this.endDate);
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            'no-show': 0
        };

        appointments.forEach(apt => {
            statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
        });

        const conversionRate = appointments.length > 0 ? ((statusCounts.completed / appointments.length) * 100) : 0;
        const cancelRate = appointments.length > 0 ? (((statusCounts.cancelled + statusCounts['no-show']) / appointments.length) * 100) : 0;

        return `
            <!-- Marketing KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Всего записей</p>
                    <p class="text-3xl font-bold">${appointments.length}</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Конверсия</p>
                    <p class="text-3xl font-bold">${conversionRate.toFixed(1)}%</p>
                </div>
                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">Отказов</p>
                    <p class="text-3xl font-bold">${statusCounts.cancelled + statusCounts['no-show']}</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <p class="text-sm opacity-90 mb-1">% отказов</p>
                    <p class="text-3xl font-bold">${cancelRate.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Appointment Status Analysis -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-chart-pie text-primary mr-2"></i>
                    Анализ статусов записей
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <canvas id="appointment-status-chart" style="max-height: 300px;"></canvas>
                    <div class="flex flex-col justify-center space-y-3">
                        <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">В ожидании</span>
                            <span class="text-lg font-bold text-yellow-600">${statusCounts.pending}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Подтверждено</span>
                            <span class="text-lg font-bold text-blue-600">${statusCounts.confirmed}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Завершено</span>
                            <span class="text-lg font-bold text-green-600">${statusCounts.completed}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Отменено</span>
                            <span class="text-lg font-bold text-red-600">${statusCounts.cancelled}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Не явились</span>
                            <span class="text-lg font-bold text-gray-600">${statusCounts['no-show']}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * After render callback
     */
    afterRender() {
        this.updateDateInputs();
        this.updateCharts();
    },

    /**
     * Update date input values
     */
    updateDateInputs() {
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        if (startInput) startInput.value = this.startDate;
        if (endInput) endInput.value = this.endDate;
    },

    /**
     * Switch report tab
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`)?.classList.add('active');

        // Reinitialize charts for the new tab
        setTimeout(() => this.updateCharts(), 100);
    },

    /**
     * Change date range
     */
    changeDateRange() {
        const rangeSelect = document.getElementById('date-range');
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');

        if (rangeSelect) {
            this.dateRange = rangeSelect.value;
        }

        if (this.dateRange === 'custom') {
            if (startInput && endInput) {
                this.startDate = startInput.value;
                this.endDate = endInput.value;
            }
        } else {
            this.calculateDateRange();
            this.updateDateInputs();
        }

        // Re-render the current tab
        App.navigate(window.location.hash);
    },

    /**
     * Update all charts for current tab
     */
    updateCharts() {
        // Destroy old charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        // Create charts based on current tab
        switch (this.currentTab) {
            case 'financial':
                this.createRevenueTrendChart();
                this.createRevenueForecastChart();
                this.createPaymentMethodsChart();
                break;
            case 'clients':
                this.createRFMSegmentsChart();
                break;
            case 'services':
                this.createServicePopularityChart();
                break;
            case 'personnel':
                this.createEmployeeRevenueChart();
                this.createEmployeeEfficiencyChart();
                break;
            case 'marketing':
                this.createAppointmentStatusChart();
                break;
        }
    },

    /**
     * Create revenue trend chart
     */
    createRevenueTrendChart() {
        const ctx = document.getElementById('revenue-trend-chart');
        if (!ctx) return;

        const grouping = document.getElementById('grouping')?.value || 'day';
        const revenueData = Database.getRevenueByPeriod(this.startDate, this.endDate, grouping);

        const labels = revenueData.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        });

        this.charts.revenueTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выручка (₽)',
                    data: revenueData.map(d => d.revenue),
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => 'Выручка: ' + context.parsed.y.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create revenue forecast chart
     */
    createRevenueForecastChart() {
        const ctx = document.getElementById('revenue-forecast-chart');
        if (!ctx) return;

        const forecast = Database.getRevenueForecasting(30);

        const historicalLabels = forecast.historical.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        });

        const forecastLabels = forecast.forecast.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        });

        this.charts.revenueForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...historicalLabels, ...forecastLabels],
                datasets: [
                    {
                        label: 'Фактическая выручка',
                        data: [...forecast.historical.map(d => d.revenue), ...Array(forecast.forecast.length).fill(null)],
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Прогноз',
                        data: [...Array(forecast.historical.length).fill(null), ...forecast.forecast.map(d => d.forecastRevenue)],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => context.dataset.label + ': ' + context.parsed.y.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create payment methods chart
     */
    createPaymentMethodsChart() {
        const ctx = document.getElementById('payment-methods-chart');
        if (!ctx) return;

        const payments = Database.getPaymentsByDateRange(this.startDate, this.endDate);
        const cashPayments = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
        const cardPayments = payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);

        this.charts.paymentMethods = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Наличные', 'Безналичные'],
                datasets: [{
                    data: [cashPayments, cardPayments],
                    backgroundColor: ['#10b981', '#3b82f6'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => context.label + ': ' + context.parsed.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create RFM segments chart
     */
    createRFMSegmentsChart() {
        const ctx = document.getElementById('rfm-segments-chart');
        if (!ctx) return;

        const rfmAnalysis = Database.getRFMAnalysis();

        this.charts.rfmSegments = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: rfmAnalysis.segmentCounts.map(s => s.segment),
                datasets: [{
                    data: rfmAnalysis.segmentCounts.map(s => s.count),
                    backgroundColor: [
                        '#eab308', '#10b981', '#3b82f6',
                        '#6b7280', '#f97316', '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    /**
     * Create service popularity chart
     */
    createServicePopularityChart() {
        const ctx = document.getElementById('service-popularity-chart');
        if (!ctx) return;

        const popularServices = Database.getServicePopularity(this.startDate, this.endDate);

        this.charts.servicePopularity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: popularServices.map(s => s.serviceName),
                datasets: [{
                    label: 'Выручка (₽)',
                    data: popularServices.map(s => s.revenue),
                    backgroundColor: 'rgba(236, 72, 153, 0.8)',
                    borderColor: '#ec4899',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => 'Выручка: ' + context.parsed.y.toLocaleString('ru-RU') + ' ₽',
                            afterLabel: (context) => 'Записей: ' + popularServices[context.dataIndex].count
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create employee revenue chart
     */
    createEmployeeRevenueChart() {
        const ctx = document.getElementById('employee-revenue-chart');
        if (!ctx) return;

        const efficiency = Database.getEmployeeEfficiency(this.startDate, this.endDate);

        this.charts.employeeRevenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: efficiency.map(e => e.employeeName),
                datasets: [{
                    label: 'Выручка (₽)',
                    data: efficiency.map(e => e.revenue),
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create employee efficiency chart
     */
    createEmployeeEfficiencyChart() {
        const ctx = document.getElementById('employee-efficiency-chart');
        if (!ctx) return;

        const efficiency = Database.getEmployeeEfficiency(this.startDate, this.endDate);

        this.charts.employeeEfficiency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: efficiency.map(e => e.employeeName),
                datasets: [{
                    label: 'Выручка за час (₽/ч)',
                    data: efficiency.map(e => e.revenuePerHour),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU') + ' ₽/ч'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create appointment status chart
     */
    createAppointmentStatusChart() {
        const ctx = document.getElementById('appointment-status-chart');
        if (!ctx) return;

        const appointments = Database.getAppointmentsByDateRange(this.startDate, this.endDate);
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            'no-show': 0
        };

        appointments.forEach(apt => {
            statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
        });

        this.charts.appointmentStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['В ожидании', 'Подтверждено', 'Завершено', 'Отменено', 'Не явились'],
                datasets: [{
                    data: [
                        statusCounts.pending,
                        statusCounts.confirmed,
                        statusCounts.completed,
                        statusCounts.cancelled,
                        statusCounts['no-show']
                    ],
                    backgroundColor: [
                        '#eab308',
                        '#3b82f6',
                        '#10b981',
                        '#ef4444',
                        '#6b7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    /**
     * Export to CSV
     */
    exportToCSV() {
        let csvContent = '';
        let filename = 'report.csv';

        switch (this.currentTab) {
            case 'financial':
                const revenueData = Database.getRevenueByPeriod(this.startDate, this.endDate, 'day');
                csvContent = 'Дата,Выручка\n';
                revenueData.forEach(day => {
                    csvContent += `${day.date},${day.revenue}\n`;
                });
                filename = 'financial_report.csv';
                break;

            case 'clients':
                const rfmAnalysis = Database.getRFMAnalysis();
                csvContent = 'Клиент,Сегмент,Частота,Сумма,RFM Score\n';
                rfmAnalysis.clients.forEach(client => {
                    csvContent += `${client.clientName},${client.segment},${client.frequency},${client.monetary},${client.rfmScore}\n`;
                });
                filename = 'clients_rfm_report.csv';
                break;

            case 'services':
                const abcAnalysis = Database.getABCAnalysis();
                csvContent = 'Услуга,Категория,Количество,Выручка,% от выручки\n';
                abcAnalysis.services.forEach(service => {
                    csvContent += `${service.serviceName},${service.category},${service.count},${service.revenue},${service.revenuePercent}\n`;
                });
                filename = 'services_abc_report.csv';
                break;

            case 'personnel':
                const efficiency = Database.getEmployeeEfficiency(this.startDate, this.endDate);
                csvContent = 'Сотрудник,Должность,Записей,Выручка,Часов,₽/час,Средний чек\n';
                efficiency.forEach(emp => {
                    csvContent += `${emp.employeeName},${emp.position},${emp.appointmentsCount},${emp.revenue},${emp.totalHours},${emp.revenuePerHour},${emp.avgCheck}\n`;
                });
                filename = 'personnel_efficiency_report.csv';
                break;
        }

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        UIUtils.showNotification('Отчет экспортирован в Excel', 'success');
    },

    /**
     * Export to PDF
     */
    exportToPDF() {
        UIUtils.showNotification('Функция экспорта в PDF будет доступна после подключения библиотеки jsPDF', 'info');
    }
};
