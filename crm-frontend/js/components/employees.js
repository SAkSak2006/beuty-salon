/**
 * Employees component with advanced management features
 */

const Employees = {
    currentView: 'cards', // cards, schedule, competency
    selectedEmployeeId: null,
    photoPreview: null,

    /**
     * Render employees page
     */
    render() {
        try {
            const employees = Database.getAll('employees');
            const stats = this.calculateOverallStatistics(employees);

            return '<div class="employees-page space-y-6">' +
                '<!-- Header -->' +
                '<div class="flex items-center justify-between">' +
                    '<h1 class="text-3xl font-bold text-gray-800">' +
                        '<i class="fas fa-user-tie text-primary mr-3"></i>' +
                        'Управление сотрудниками' +
                    '</h1>' +
                    '<div class="flex space-x-3">' +
                        '<button onclick="Employees.generateExtendedEmployees()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">' +
                            '<i class="fas fa-database mr-2"></i>Генерировать' +
                        '</button>' +
                        '<button onclick="Employees.showAddModal()" class="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                            '<i class="fas fa-user-plus mr-2"></i>Новый сотрудник' +
                        '</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Statistics Cards -->' +
                '<div class="grid grid-cols-1 md:grid-cols-4 gap-4">' +
                    this.renderStatCard('Всего сотрудников', stats.total, 'fa-users', 'from-blue-500 to-blue-600') +
                    this.renderStatCard('Работают', stats.working, 'fa-check-circle', 'from-green-500 to-green-600') +
                    this.renderStatCard('Средняя зарплата', stats.avgSalary + ' ₽', 'fa-ruble-sign', 'from-yellow-500 to-yellow-600') +
                    this.renderStatCard('Записей сегодня', stats.todayAppointments, 'fa-calendar-day', 'from-purple-500 to-purple-600') +
                '</div>' +

                '<!-- View Tabs -->' +
                '<div class="bg-white rounded-xl shadow-md p-2 inline-flex space-x-2">' +
                    '<button onclick="Employees.switchView(\'cards\')" ' +
                        'class="px-4 py-2 rounded-lg transition ' + (this.currentView === 'cards' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100') + '">' +
                        '<i class="fas fa-th-large mr-2"></i>Карточки' +
                    '</button>' +
                    '<button onclick="Employees.switchView(\'schedule\')" ' +
                        'class="px-4 py-2 rounded-lg transition ' + (this.currentView === 'schedule' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100') + '">' +
                        '<i class="fas fa-calendar-alt mr-2"></i>Расписание' +
                    '</button>' +
                    '<button onclick="Employees.switchView(\'competency\')" ' +
                        'class="px-4 py-2 rounded-lg transition ' + (this.currentView === 'competency' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100') + '">' +
                        '<i class="fas fa-star mr-2"></i>Компетенции' +
                    '</button>' +
                '</div>' +

                '<!-- Content based on current view -->' +
                this.renderCurrentView(employees) +

                this.renderModals() +
            '</div>';
        } catch (error) {
            console.error('Error rendering employees:', error);
            Toast.error('Ошибка при загрузке сотрудников');
            return '<div class="p-4 text-red-600">Ошибка загрузки</div>';
        }
    },

    /**
     * Render statistics card
     */
    renderStatCard(title, value, icon, gradient) {
        return '<div class="bg-gradient-to-br ' + gradient + ' rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">' +
            '<div class="flex items-center justify-between">' +
                '<div>' +
                    '<p class="text-sm opacity-90">' + title + '</p>' +
                    '<p class="text-3xl font-bold mt-2">' + value + '</p>' +
                '</div>' +
                '<i class="fas ' + icon + ' text-4xl opacity-50"></i>' +
            '</div>' +
        '</div>';
    },

    /**
     * Calculate overall statistics
     */
    calculateOverallStatistics(employees) {
        const working = employees.filter(function(e) { return e.status === 'working'; });
        const totalSalary = employees.reduce(function(sum, e) { return sum + (e.salary || 0); }, 0);
        const avgSalary = employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;

        const today = DateUtils.getCurrentDate();
        const todayAppointments = Database.getAll('appointments').filter(function(apt) {
            return apt.date === today;
        }).length;

        return {
            total: employees.length,
            working: working.length,
            avgSalary: avgSalary,
            todayAppointments: todayAppointments
        };
    },

    /**
     * Render current view
     */
    renderCurrentView(employees) {
        if (this.currentView === 'cards') {
            return this.renderCardsView(employees);
        } else if (this.currentView === 'schedule') {
            return this.renderScheduleView(employees);
        } else if (this.currentView === 'competency') {
            return this.renderCompetencyView(employees);
        }
        return '';
    },

    /**
     * Render cards view
     */
    renderCardsView(employees) {
        if (employees.length === 0) {
            return '<div class="bg-white rounded-xl shadow-md p-12 text-center">' +
                '<i class="fas fa-user-tie text-6xl text-gray-300 mb-4"></i>' +
                '<p class="text-gray-500 text-lg">Нет сотрудников</p>' +
            '</div>';
        }

        return '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">' +
            employees.map(function(employee) {
                return Employees.renderEmployeeCard(employee);
            }).join('') +
        '</div>';
    },

    /**
     * Render employee card
     */
    renderEmployeeCard(employee) {
        const appointments = Database.getAppointmentsByEmployee(employee.id);
        const today = DateUtils.getCurrentDate();
        const todayAppointments = appointments.filter(function(apt) { return apt.date === today; });

        const statusColors = {
            'working': 'bg-green-500',
            'vacation': 'bg-yellow-500',
            'dismissed': 'bg-red-500'
        };

        const statusLabels = {
            'working': 'Работает',
            'vacation': 'В отпуске',
            'dismissed': 'Уволен'
        };

        const skillColors = {
            'junior': 'bg-blue-100 text-blue-800',
            'middle': 'bg-purple-100 text-purple-800',
            'senior': 'bg-pink-100 text-pink-800'
        };

        const skillLabels = {
            'junior': 'Junior',
            'middle': 'Middle',
            'senior': 'Senior'
        };

        // Get completed appointments for salary calculation
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const salaryInfo = Database.calculateEmployeeSalary(
            employee.id,
            startOfMonth.toISOString().split('T')[0],
            today
        );

        return '<div class="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">' +
            '<!-- Header with photo -->' +
            '<div class="bg-gradient-to-r from-secondary to-primary p-6 relative">' +
                '<div class="absolute top-2 right-2">' +
                    '<span class="px-3 py-1 rounded-full text-white text-xs font-semibold ' + statusColors[employee.status || 'working'] + '">' +
                        statusLabels[employee.status || 'working'] +
                    '</span>' +
                '</div>' +
                '<div class="flex items-center space-x-4">' +
                    '<div class="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg" ' +
                        'onclick="Employees.showPhotoUpload(' + employee.id + ')" title="Нажмите для загрузки фото" style="cursor: pointer;">' +
                        (employee.photo ?
                            '<img src="' + employee.photo + '" alt="' + employee.name + '" class="w-full h-full object-cover">'
                            :
                            '<i class="fas fa-user-tie text-3xl text-secondary"></i>'
                        ) +
                    '</div>' +
                    '<div class="flex-1 text-white">' +
                        '<h3 class="text-xl font-bold">' + employee.name + '</h3>' +
                        '<p class="text-sm opacity-90">' + employee.position + '</p>' +
                        '<div class="mt-1">' +
                            '<span class="px-2 py-1 rounded text-xs font-semibold ' + skillColors[employee.skillLevel || 'middle'] + '">' +
                                skillLabels[employee.skillLevel || 'middle'] +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Contact info -->' +
            '<div class="p-4 space-y-2 border-b">' +
                '<div class="flex items-center text-gray-600 text-sm">' +
                    '<i class="fas fa-phone w-6 text-primary"></i>' +
                    '<span>' + employee.phone + '</span>' +
                '</div>' +
                (employee.email ?
                    '<div class="flex items-center text-gray-600 text-sm">' +
                        '<i class="fas fa-envelope w-6 text-primary"></i>' +
                        '<span>' + employee.email + '</span>' +
                    '</div>'
                    : ''
                ) +
                '<div class="flex items-center text-gray-600 text-sm">' +
                    '<i class="fas fa-calendar w-6 text-primary"></i>' +
                    '<span>С ' + (employee.hireDate || 'N/A') + '</span>' +
                '</div>' +
            '</div>' +

            '<!-- Statistics -->' +
            '<div class="p-4 border-b">' +
                '<div class="grid grid-cols-2 gap-4 mb-3">' +
                    '<div class="text-center">' +
                        '<p class="text-2xl font-bold text-primary">' + todayAppointments.length + '</p>' +
                        '<p class="text-xs text-gray-500">Сегодня</p>' +
                    '</div>' +
                    '<div class="text-center">' +
                        '<p class="text-2xl font-bold text-secondary">' + appointments.length + '</p>' +
                        '<p class="text-xs text-gray-500">Всего</p>' +
                    '</div>' +
                '</div>' +
                (salaryInfo ?
                    '<div class="bg-green-50 rounded-lg p-3">' +
                        '<div class="flex items-center justify-between mb-1">' +
                            '<span class="text-sm text-gray-600">Оклад:</span>' +
                            '<span class="font-semibold text-gray-800">' + employee.salary + ' ₽</span>' +
                        '</div>' +
                        '<div class="flex items-center justify-between mb-1">' +
                            '<span class="text-sm text-gray-600">Процент (' + employee.commission + '%):</span>' +
                            '<span class="font-semibold text-green-600">+' + salaryInfo.commissionAmount + ' ₽</span>' +
                        '</div>' +
                        '<div class="flex items-center justify-between pt-2 border-t border-green-200">' +
                            '<span class="text-sm font-bold text-gray-800">Итого за месяц:</span>' +
                            '<span class="text-lg font-bold text-green-600">' + salaryInfo.totalSalary + ' ₽</span>' +
                        '</div>' +
                    '</div>'
                    : ''
                ) +
            '</div>' +

            '<!-- Action buttons -->' +
            '<div class="p-4">' +
                '<div class="grid grid-cols-2 gap-2 mb-2">' +
                    '<button onclick="Employees.showScheduleModal(' + employee.id + ')" ' +
                        'class="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm">' +
                        '<i class="fas fa-calendar-alt mr-1"></i>Расписание' +
                    '</button>' +
                    '<button onclick="Employees.showVacationModal(' + employee.id + ')" ' +
                        'class="px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition text-sm">' +
                        '<i class="fas fa-umbrella-beach mr-1"></i>Отпуска' +
                    '</button>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-2">' +
                    '<button onclick="Employees.edit(' + employee.id + ')" ' +
                        'class="px-3 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition text-sm">' +
                        '<i class="fas fa-edit mr-1"></i>Изменить' +
                    '</button>' +
                    '<button onclick="Employees.deleteEmployee(' + employee.id + ')" ' +
                        'class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">' +
                        '<i class="fas fa-trash mr-1"></i>Удалить' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    },

    /**
     * Render schedule view
     */
    renderScheduleView(employees) {
        return '<div class="bg-white rounded-xl shadow-md p-6">' +
            '<h2 class="text-2xl font-bold text-gray-800 mb-6">' +
                '<i class="fas fa-calendar-alt mr-2"></i>Расписание работы сотрудников' +
            '</h2>' +
            '<div class="space-y-6">' +
                employees.map(function(employee) {
                    return Employees.renderEmployeeSchedule(employee);
                }).join('') +
            '</div>' +
        '</div>';
    },

    /**
     * Render employee schedule
     */
    renderEmployeeSchedule(employee) {
        const schedules = Database.getAll('schedule').filter(function(s) {
            return s.employeeId === employee.id;
        });

        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        return '<div class="border border-gray-200 rounded-lg p-4">' +
            '<div class="flex items-center justify-between mb-4">' +
                '<div class="flex items-center space-x-3">' +
                    '<div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">' +
                        '<i class="fas fa-user-tie text-white text-xl"></i>' +
                    '</div>' +
                    '<div>' +
                        '<h3 class="font-bold text-gray-800">' + employee.name + '</h3>' +
                        '<p class="text-sm text-gray-600">' + employee.position + '</p>' +
                    '</div>' +
                '</div>' +
                '<button onclick="Employees.showScheduleModal(' + employee.id + ')" ' +
                    'class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">' +
                    '<i class="fas fa-edit mr-1"></i>Изменить' +
                '</button>' +
            '</div>' +

            '<div class="grid grid-cols-7 gap-2">' +
                days.map(function(day, index) {
                    const schedule = schedules.find(function(s) { return s.dayOfWeek === index; });
                    const isWorking = schedule && schedule.isWorkingDay;

                    return '<div class="text-center p-3 rounded-lg ' + (isWorking ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200') + '">' +
                        '<p class="text-xs font-semibold text-gray-600 mb-1">' + day + '</p>' +
                        (isWorking ?
                            '<p class="text-xs text-green-700 font-bold">' + schedule.startTime + '</p>' +
                            '<p class="text-xs text-gray-500">-</p>' +
                            '<p class="text-xs text-green-700 font-bold">' + schedule.endTime + '</p>'
                            :
                            '<p class="text-xs text-gray-400">Выходной</p>'
                        ) +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';
    },

    /**
     * Render competency view
     */
    renderCompetencyView(employees) {
        const services = Database.getAll('services');
        const categories = Database.getAll('serviceCategories');

        return '<div class="bg-white rounded-xl shadow-md overflow-x-auto">' +
            '<div class="p-6">' +
                '<h2 class="text-2xl font-bold text-gray-800 mb-6">' +
                    '<i class="fas fa-star mr-2"></i>Матрица компетенций' +
                '</h2>' +

                categories.map(function(category) {
                    const categoryServices = services.filter(function(s) { return s.categoryId === category.id; });
                    if (categoryServices.length === 0) return '';

                    return '<div class="mb-8">' +
                        '<h3 class="text-lg font-bold text-gray-700 mb-4 flex items-center">' +
                            '<i class="fas ' + category.icon + ' mr-2" style="color: ' + category.color + '"></i>' +
                            category.name +
                        '</h3>' +
                        '<div class="overflow-x-auto">' +
                            '<table class="w-full border-collapse">' +
                                '<thead>' +
                                    '<tr class="bg-gray-50">' +
                                        '<th class="border border-gray-200 px-4 py-2 text-left text-sm font-semibold">Услуга</th>' +
                                        employees.map(function(emp) {
                                            return '<th class="border border-gray-200 px-2 py-2 text-center text-sm font-semibold">' +
                                                '<div class="flex flex-col items-center">' +
                                                    '<span class="text-xs">' + emp.name.split(' ')[0] + '</span>' +
                                                '</div>' +
                                            '</th>';
                                        }).join('') +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    categoryServices.map(function(service) {
                                        return '<tr class="hover:bg-gray-50">' +
                                            '<td class="border border-gray-200 px-4 py-2 text-sm">' + service.name + '</td>' +
                                            employees.map(function(emp) {
                                                const competency = (Database.getAll('competencyMatrix') || []).find(function(c) {
                                                    return c.employeeId === emp.id && c.serviceId === service.id;
                                                });

                                                if (competency && competency.canPerform) {
                                                    const duration = competency.customDuration || service.duration;
                                                    return '<td class="border border-gray-200 px-2 py-2 text-center">' +
                                                        '<div class="flex flex-col items-center">' +
                                                            '<i class="fas fa-check-circle text-green-600 text-lg mb-1"></i>' +
                                                            '<span class="text-xs text-gray-600">' + duration + ' мин</span>' +
                                                        '</div>' +
                                                    '</td>';
                                                } else {
                                                    return '<td class="border border-gray-200 px-2 py-2 text-center">' +
                                                        '<i class="fas fa-times-circle text-gray-300"></i>' +
                                                    '</td>';
                                                }
                                            }).join('') +
                                        '</tr>';
                                    }).join('') +
                                '</tbody>' +
                            '</table>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';
    },

    /**
     * Render all modals
     */
    renderModals() {
        const services = Database.getAll('services');
        const categories = Database.getAll('serviceCategories');

        return '<!-- Employee Modal -->' +
            '<div id="employee-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800" id="modal-title">Новый сотрудник</h2>' +
                            '<button onclick="Employees.closeModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<form id="employee-form" class="space-y-4">' +
                            '<input type="hidden" id="employee-id">' +

                            '<div class="grid grid-cols-2 gap-4">' +
                                '<div class="col-span-2">' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">ФИО *</label>' +
                                    '<input type="text" id="employee-name" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Должность *</label>' +
                                    '<input type="text" id="employee-position" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Уровень мастерства *</label>' +
                                    '<select id="employee-skill-level" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                        '<option value="junior">Junior (новичок)</option>' +
                                        '<option value="middle" selected>Middle (опытный)</option>' +
                                        '<option value="senior">Senior (эксперт)</option>' +
                                    '</select>' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>' +
                                    '<input type="tel" id="employee-phone" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Email</label>' +
                                    '<input type="email" id="employee-email" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Оклад (₽) *</label>' +
                                    '<input type="number" id="employee-salary" required min="0" step="1000" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Процент от выручки (%) *</label>' +
                                    '<input type="number" id="employee-commission" required min="0" max="100" step="1" value="25" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Дата найма</label>' +
                                    '<input type="date" id="employee-hireDate" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Статус</label>' +
                                    '<select id="employee-status" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                        '<option value="working">Работает</option>' +
                                        '<option value="vacation">В отпуске</option>' +
                                        '<option value="dismissed">Уволен</option>' +
                                    '</select>' +
                                '</div>' +

                                '<div class="col-span-2">' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Специализация (услуги)</label>' +
                                    '<div class="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">' +
                                        categories.map(function(cat) {
                                            const catServices = services.filter(function(s) { return s.categoryId === cat.id; });
                                            return '<div class="mb-3">' +
                                                '<h4 class="font-semibold text-sm text-gray-700 mb-2">' + cat.name + '</h4>' +
                                                catServices.map(function(service) {
                                                    return '<label class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">' +
                                                        '<input type="checkbox" name="specialization" value="' + service.id + '" class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded">' +
                                                        '<span class="text-sm text-gray-700">' + service.name + '</span>' +
                                                    '</label>';
                                                }).join('') +
                                            '</div>';
                                        }).join('') +
                                    '</div>' +
                                '</div>' +
                            '</div>' +

                            '<div class="flex space-x-4 pt-4">' +
                                '<button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                                    '<i class="fas fa-save mr-2"></i>Сохранить' +
                                '</button>' +
                                '<button type="button" onclick="Employees.closeModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Отмена' +
                                '</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Photo Upload Modal -->' +
            '<div id="photo-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-md w-full animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">Загрузить фото</h2>' +
                            '<button onclick="Employees.closePhotoModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<div class="space-y-4">' +
                            '<div class="flex justify-center">' +
                                '<div id="photo-preview" class="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-primary">' +
                                    '<i class="fas fa-user-tie text-6xl text-gray-400"></i>' +
                                '</div>' +
                            '</div>' +

                            '<div>' +
                                '<label class="block w-full cursor-pointer">' +
                                    '<div class="px-6 py-4 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition">' +
                                        '<i class="fas fa-upload mr-2"></i>Выбрать фото' +
                                    '</div>' +
                                    '<input type="file" id="photo-input" accept="image/*" class="hidden" onchange="Employees.handlePhotoSelect(event)">' +
                                '</label>' +
                                '<p class="text-xs text-gray-500 mt-2 text-center">Рекомендуется квадратное изображение</p>' +
                            '</div>' +

                            '<div class="flex space-x-4 pt-4">' +
                                '<button onclick="Employees.savePhoto()" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                                    '<i class="fas fa-save mr-2"></i>Сохранить' +
                                '</button>' +
                                '<button onclick="Employees.closePhotoModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Отмена' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Schedule Modal -->' +
            '<div id="schedule-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">Расписание работы</h2>' +
                            '<button onclick="Employees.closeScheduleModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<div class="space-y-4">' +
                            '<div class="flex space-x-2">' +
                                '<button onclick="Employees.applyScheduleTemplate(\'5/2\')" ' +
                                    'class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">' +
                                    '5/2 (Пн-Пт)' +
                                '</button>' +
                                '<button onclick="Employees.applyScheduleTemplate(\'2/2\')" ' +
                                    'class="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm">' +
                                    '2/2 (Через день)' +
                                '</button>' +
                            '</div>' +

                            '<div id="schedule-editor"></div>' +

                            '<div class="flex space-x-4 pt-4">' +
                                '<button onclick="Employees.saveSchedule()" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                                    '<i class="fas fa-save mr-2"></i>Сохранить' +
                                '</button>' +
                                '<button onclick="Employees.closeScheduleModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Отмена' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Vacation Modal -->' +
            '<div id="vacation-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">Отпуска и больничные</h2>' +
                            '<button onclick="Employees.closeVacationModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<div class="space-y-4">' +
                            '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">' +
                                '<h3 class="font-bold text-gray-800 mb-3">Добавить отпуск/больничный</h3>' +
                                '<div class="grid grid-cols-2 gap-3">' +
                                    '<div>' +
                                        '<label class="block text-sm text-gray-700 mb-1">С</label>' +
                                        '<input type="date" id="vacation-start" class="w-full px-3 py-2 border border-gray-300 rounded-lg">' +
                                    '</div>' +
                                    '<div>' +
                                        '<label class="block text-sm text-gray-700 mb-1">По</label>' +
                                        '<input type="date" id="vacation-end" class="w-full px-3 py-2 border border-gray-300 rounded-lg">' +
                                    '</div>' +
                                    '<div class="col-span-2">' +
                                        '<label class="block text-sm text-gray-700 mb-1">Тип</label>' +
                                        '<select id="vacation-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg">' +
                                            '<option value="vacation">Отпуск</option>' +
                                            '<option value="sick">Больничный</option>' +
                                            '<option value="other">Другое</option>' +
                                        '</select>' +
                                    '</div>' +
                                    '<div class="col-span-2">' +
                                        '<label class="block text-sm text-gray-700 mb-1">Примечание</label>' +
                                        '<input type="text" id="vacation-reason" placeholder="Причина (опционально)" class="w-full px-3 py-2 border border-gray-300 rounded-lg">' +
                                    '</div>' +
                                    '<div class="col-span-2">' +
                                        '<button onclick="Employees.addVacation()" class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">' +
                                            '<i class="fas fa-plus mr-2"></i>Добавить' +
                                        '</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +

                            '<div id="vacation-list"></div>' +

                            '<div class="flex justify-end pt-4">' +
                                '<button onclick="Employees.closeVacationModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Закрыть' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    /**
     * After render callback
     */
    afterRender() {
        this.setupForm();
    },

    /**
     * Setup form handler
     */
    setupForm() {
        const form = document.getElementById('employee-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                Employees.save();
            });
        }
    },

    /**
     * Switch view
     */
    switchView(view) {
        this.currentView = view;
        App.refresh();
    },

    /**
     * Show add modal
     */
    showAddModal() {
        document.getElementById('modal-title').textContent = 'Новый сотрудник';
        document.getElementById('employee-form').reset();
        document.getElementById('employee-id').value = '';
        document.getElementById('employee-hireDate').value = DateUtils.getCurrentDate();
        document.getElementById('employee-status').value = 'working';
        document.getElementById('employee-skill-level').value = 'middle';
        document.getElementById('employee-commission').value = '25';
        document.getElementById('employee-modal').classList.remove('hidden');
    },

    /**
     * Edit employee
     */
    edit(id) {
        const employee = Database.getById('employees', id);
        if (!employee) return;

        document.getElementById('modal-title').textContent = 'Редактировать сотрудника';
        document.getElementById('employee-id').value = employee.id;
        document.getElementById('employee-name').value = employee.name;
        document.getElementById('employee-position').value = employee.position;
        document.getElementById('employee-phone').value = employee.phone;
        document.getElementById('employee-email').value = employee.email || '';
        document.getElementById('employee-salary').value = employee.salary || '';
        document.getElementById('employee-commission').value = employee.commission || 25;
        document.getElementById('employee-hireDate').value = employee.hireDate || '';
        document.getElementById('employee-status').value = employee.status || 'working';
        document.getElementById('employee-skill-level').value = employee.skillLevel || 'middle';

        // Set specialization checkboxes
        const checkboxes = document.querySelectorAll('input[name="specialization"]');
        checkboxes.forEach(function(cb) {
            cb.checked = employee.specialization && employee.specialization.indexOf(parseInt(cb.value)) !== -1;
        });

        document.getElementById('employee-modal').classList.remove('hidden');
    },

    /**
     * Save employee
     */
    save() {
        try {
            const id = document.getElementById('employee-id').value;

            const specialization = Array.from(document.querySelectorAll('input[name="specialization"]:checked'))
                .map(function(cb) { return parseInt(cb.value); });

            const data = {
                name: document.getElementById('employee-name').value,
                position: document.getElementById('employee-position').value,
                phone: document.getElementById('employee-phone').value,
                email: document.getElementById('employee-email').value || '',
                salary: parseInt(document.getElementById('employee-salary').value) || 0,
                commission: parseInt(document.getElementById('employee-commission').value) || 0,
                hireDate: document.getElementById('employee-hireDate').value || DateUtils.getCurrentDate(),
                status: document.getElementById('employee-status').value || 'working',
                skillLevel: document.getElementById('employee-skill-level').value || 'middle',
                specialization: specialization,
                photo: ''
            };

            if (id) {
                const existing = Database.getById('employees', parseInt(id));
                data.photo = existing.photo || '';
                Database.update('employees', parseInt(id), data);
                Toast.success('Сотрудник обновлен');
            } else {
                Database.create('employees', data);
                Toast.success('Сотрудник добавлен');
            }

            this.closeModal();
            App.refresh();
        } catch (error) {
            console.error('Error saving employee:', error);
            Toast.error('Ошибка при сохранении сотрудника');
        }
    },

    /**
     * Delete employee
     */
    deleteEmployee(id) {
        if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                Database.delete('employees', id);
                Toast.success('Сотрудник удален');
                App.refresh();
            } catch (error) {
                console.error('Error deleting employee:', error);
                Toast.error('Ошибка при удалении сотрудника');
            }
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('employee-modal').classList.add('hidden');
    },

    /**
     * Show photo upload modal
     */
    showPhotoUpload(employeeId) {
        this.selectedEmployeeId = employeeId;
        this.photoPreview = null;

        const employee = Database.getById('employees', employeeId);
        const preview = document.getElementById('photo-preview');

        if (employee && employee.photo) {
            preview.innerHTML = '<img src="' + employee.photo + '" class="w-full h-full object-cover">';
            this.photoPreview = employee.photo;
        } else {
            preview.innerHTML = '<i class="fas fa-user-tie text-6xl text-gray-400"></i>';
        }

        document.getElementById('photo-modal').classList.remove('hidden');
    },

    /**
     * Handle photo file select
     */
    handlePhotoSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            Employees.photoPreview = e.target.result;
            document.getElementById('photo-preview').innerHTML =
                '<img src="' + e.target.result + '" class="w-full h-full object-cover">';
        };
        reader.readAsDataURL(file);
    },

    /**
     * Save photo
     */
    savePhoto() {
        if (!this.photoPreview) {
            Toast.warning('Пожалуйста, выберите фото');
            return;
        }

        try {
            Database.update('employees', this.selectedEmployeeId, { photo: this.photoPreview });
            Toast.success('Фото обновлено');
            this.closePhotoModal();
            App.refresh();
        } catch (error) {
            console.error('Error saving photo:', error);
            Toast.error('Ошибка при сохранении фото');
        }
    },

    closePhotoModal() {
        document.getElementById('photo-modal').classList.add('hidden');
        this.photoPreview = null;
    },

    /**
     * Show schedule modal
     */
    showScheduleModal(employeeId) {
        this.selectedEmployeeId = employeeId;
        const employee = Database.getById('employees', employeeId);

        // Render schedule editor
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const schedules = Database.getAll('schedule').filter(function(s) { return s.employeeId === employeeId; });

        let html = '<div class="space-y-3">';
        for (let day = 0; day < 7; day++) {
            const schedule = schedules.find(function(s) { return s.dayOfWeek === day; });
            const isWorking = schedule ? schedule.isWorkingDay : false;
            const startTime = schedule ? schedule.startTime : '09:00';
            const endTime = schedule ? schedule.endTime : '18:00';

            html += '<div class="border border-gray-200 rounded-lg p-3">' +
                '<div class="flex items-center justify-between mb-2">' +
                    '<label class="flex items-center space-x-2">' +
                        '<input type="checkbox" data-day="' + day + '" class="schedule-working" ' + (isWorking ? 'checked' : '') + ' ' +
                            'onchange="Employees.toggleDayWorking(' + day + ', this.checked)">' +
                        '<span class="font-semibold">' + days[day] + '</span>' +
                    '</label>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-2 schedule-times-' + day + ' ' + (isWorking ? '' : 'hidden') + '">' +
                    '<input type="time" data-day="' + day + '" class="schedule-start px-3 py-2 border border-gray-300 rounded-lg" value="' + startTime + '">' +
                    '<input type="time" data-day="' + day + '" class="schedule-end px-3 py-2 border border-gray-300 rounded-lg" value="' + endTime + '">' +
                '</div>' +
            '</div>';
        }
        html += '</div>';

        document.getElementById('schedule-editor').innerHTML = html;
        document.getElementById('schedule-modal').classList.remove('hidden');
    },

    toggleDayWorking(day, isWorking) {
        const timesDiv = document.querySelector('.schedule-times-' + day);
        if (timesDiv) {
            if (isWorking) {
                timesDiv.classList.remove('hidden');
            } else {
                timesDiv.classList.add('hidden');
            }
        }
    },

    applyScheduleTemplate(template) {
        if (confirm('Применить шаблон "' + template + '"?')) {
            try {
                Database.applyScheduleTemplate(this.selectedEmployeeId, template);
                Toast.success('Шаблон применен');
                this.closeScheduleModal();
                this.showScheduleModal(this.selectedEmployeeId);
            } catch (error) {
                console.error('Error applying template:', error);
                Toast.error('Ошибка при применении шаблона');
            }
        }
    },

    saveSchedule() {
        try {
            const db = Database.getDatabase();
            let schedules = db.schedule.filter(function(s) { return s.employeeId !== Employees.selectedEmployeeId; });

            for (let day = 0; day < 7; day++) {
                const isWorking = document.querySelector('.schedule-working[data-day="' + day + '"]').checked;
                const startTime = isWorking ? document.querySelector('.schedule-start[data-day="' + day + '"]').value : '00:00';
                const endTime = isWorking ? document.querySelector('.schedule-end[data-day="' + day + '"]').value : '00:00';

                schedules.push({
                    id: schedules.length + 1,
                    employeeId: Employees.selectedEmployeeId,
                    dayOfWeek: day,
                    startTime: startTime,
                    endTime: endTime,
                    isWorkingDay: isWorking
                });
            }

            db.schedule = schedules;
            Database.saveDatabase(db);

            Toast.success('Расписание сохранено');
            this.closeScheduleModal();
            App.refresh();
        } catch (error) {
            console.error('Error saving schedule:', error);
            Toast.error('Ошибка при сохранении расписания');
        }
    },

    closeScheduleModal() {
        document.getElementById('schedule-modal').classList.add('hidden');
    },

    /**
     * Show vacation modal
     */
    showVacationModal(employeeId) {
        this.selectedEmployeeId = employeeId;
        this.renderVacationList();
        document.getElementById('vacation-modal').classList.remove('hidden');
    },

    renderVacationList() {
        const vacations = Database.getAll('vacations').filter(function(v) {
            return v.employeeId === Employees.selectedEmployeeId;
        }).sort(function(a, b) {
            return new Date(b.startDate) - new Date(a.startDate);
        });

        const typeLabels = {
            'vacation': 'Отпуск',
            'sick': 'Больничный',
            'other': 'Другое'
        };

        const typeColors = {
            'vacation': 'bg-blue-100 text-blue-800',
            'sick': 'bg-red-100 text-red-800',
            'other': 'bg-gray-100 text-gray-800'
        };

        let html = '<div class="space-y-3">';
        if (vacations.length === 0) {
            html += '<p class="text-center text-gray-500 py-4">Нет записей об отпусках</p>';
        } else {
            vacations.forEach(function(vacation) {
                html += '<div class="border border-gray-200 rounded-lg p-4">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<span class="px-3 py-1 rounded-full text-xs font-semibold ' + typeColors[vacation.type] + '">' +
                            typeLabels[vacation.type] +
                        '</span>' +
                        '<button onclick="Employees.deleteVacation(' + vacation.id + ')" class="text-red-600 hover:text-red-800">' +
                            '<i class="fas fa-trash"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="text-sm text-gray-700">' +
                        '<i class="fas fa-calendar mr-2"></i>' +
                        vacation.startDate + ' — ' + vacation.endDate +
                    '</div>' +
                    (vacation.reason ?
                        '<div class="text-sm text-gray-600 mt-2">' +
                            '<i class="fas fa-info-circle mr-2"></i>' + vacation.reason +
                        '</div>'
                        : ''
                    ) +
                '</div>';
            });
        }
        html += '</div>';

        document.getElementById('vacation-list').innerHTML = html;
    },

    addVacation() {
        try {
            const startDate = document.getElementById('vacation-start').value;
            const endDate = document.getElementById('vacation-end').value;
            const type = document.getElementById('vacation-type').value;
            const reason = document.getElementById('vacation-reason').value;

            if (!startDate || !endDate) {
                Toast.warning('Укажите даты начала и окончания');
                return;
            }

            Database.addVacation(this.selectedEmployeeId, startDate, endDate, type, reason);
            Toast.success('Отпуск добавлен');

            document.getElementById('vacation-start').value = '';
            document.getElementById('vacation-end').value = '';
            document.getElementById('vacation-reason').value = '';

            this.renderVacationList();
        } catch (error) {
            console.error('Error adding vacation:', error);
            Toast.error('Ошибка при добавлении отпуска');
        }
    },

    deleteVacation(vacationId) {
        if (confirm('Удалить запись об отпуске?')) {
            try {
                Database.delete('vacations', vacationId);
                Toast.success('Запись удалена');
                this.renderVacationList();
            } catch (error) {
                console.error('Error deleting vacation:', error);
                Toast.error('Ошибка при удалении записи');
            }
        }
    },

    closeVacationModal() {
        document.getElementById('vacation-modal').classList.add('hidden');
    },

    /**
     * Generate extended employees
     */
    generateExtendedEmployees() {
        if (confirm('Это заменит текущий список сотрудников на расширенный (7 сотрудников с компетенциями). Продолжить?')) {
            try {
                Database.generateExtendedEmployees();
                Database.generateExtendedServices();
                Toast.success('Сгенерировано 7 сотрудников и 39 услуг с матрицей компетенций');
                App.refresh();
            } catch (error) {
                console.error('Error generating employees:', error);
                Toast.error('Ошибка при генерации данных');
            }
        }
    }
};
