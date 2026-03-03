/**
 * Appointments Management with FullCalendar
 * Complete appointment scheduling system
 */

const Appointments = {
    calendar: null,
    selectedEmployees: [],
    selectedServices: [],
    selectedStatuses: ['confirmed', 'pending'],
    currentView: 'timeGridWeek',

    statusConfig: {
        confirmed: { color: '#10b981', label: 'Подтверждено' },
        pending: { color: '#f59e0b', label: 'Ожидает' },
        completed: { color: '#3b82f6', label: 'Завершено' },
        cancelled: { color: '#ef4444', label: 'Отменено' },
        'no-show': { color: '#6b7280', label: 'Не пришел' }
    },

    render() {
        const employees = Database.getAll('employees');
        const stats = this.getStatistics();

        if (this.selectedEmployees.length === 0) {
            this.selectedEmployees = employees.map(e => e.id);
        }

        const employeeCheckboxes = employees.map(emp => 
            '<label class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">' +
            '<input type="checkbox" ' + (this.selectedEmployees.includes(emp.id) ? 'checked' : '') +
            ' onchange="Appointments.toggleEmployee(' + emp.id + ')" ' +
            'class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded">' +
            '<span class="text-sm text-gray-700">' + emp.name + '</span>' +
            '</label>'
        ).join('');

        const statusCheckboxes = Object.entries(this.statusConfig).map(([status, config]) =>
            '<label class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">' +
            '<input type="checkbox" ' + (this.selectedStatuses.includes(status) ? 'checked' : '') +
            ' onchange="Appointments.toggleStatus(\'' + status + '\')" ' +
            'class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded">' +
            '<span class="w-3 h-3 rounded-full" style="background-color: ' + config.color + '"></span>' +
            '<span class="text-sm text-gray-700">' + config.label + '</span>' +
            '</label>'
        ).join('');

        return '<div class="appointments-page">' +
            '<div class="mb-6">' +
                '<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">' +
                    '<div>' +
                        '<h1 class="text-3xl font-bold text-gray-800">' +
                            '<i class="fas fa-calendar-alt text-primary mr-3"></i>' +
                            'Календарь записей' +
                        '</h1>' +
                        '<p class="text-gray-500 mt-1">Управление расписанием салона</p>' +
                    '</div>' +
                    '<div class="flex flex-wrap gap-2">' +
                        '<button onclick="Appointments.showAddModal()" class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                            '<i class="fas fa-plus mr-2"></i>Новая запись' +
                        '</button>' +
                        '<button onclick="Appointments.generateTestData()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">' +
                            '<i class="fas fa-database mr-2"></i>Тестовые данные' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="grid grid-cols-1 md:grid-cols-5 gap-4">' +
                    '<div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-4 text-white">' +
                        '<p class="text-sm opacity-90">Сегодня</p>' +
                        '<p class="text-2xl font-bold mt-1">' + stats.today + '</p>' +
                    '</div>' +
                    '<div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-4 text-white">' +
                        '<p class="text-sm opacity-90">На неделю</p>' +
                        '<p class="text-2xl font-bold mt-1">' + stats.week + '</p>' +
                    '</div>' +
                    '<div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-4 text-white">' +
                        '<p class="text-sm opacity-90">На месяц</p>' +
                        '<p class="text-2xl font-bold mt-1">' + stats.month + '</p>' +
                    '</div>' +
                    '<div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md p-4 text-white">' +
                        '<p class="text-sm opacity-90">% отмен</p>' +
                        '<p class="text-2xl font-bold mt-1">' + stats.cancellationRate + '%</p>' +
                    '</div>' +
                    '<div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md p-4 text-white">' +
                        '<p class="text-sm opacity-90">Загрузка</p>' +
                        '<p class="text-2xl font-bold mt-1">' + stats.employeeLoad + '%</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">' +
                '<div class="lg:col-span-1 space-y-4">' +
                    '<div class="bg-white rounded-xl shadow-md p-4">' +
                        '<h3 class="text-lg font-semibold text-gray-800 mb-3">' +
                            '<i class="fas fa-bolt text-yellow-500 mr-2"></i>Быстрые действия' +
                        '</h3>' +
                        '<div class="space-y-2">' +
                            '<button onclick="Appointments.calendar && Appointments.calendar.today()" class="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm">' +
                                '<i class="fas fa-calendar-day mr-2"></i>Сегодня' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bg-white rounded-xl shadow-md p-4">' +
                        '<h3 class="text-lg font-semibold text-gray-800 mb-3">' +
                            '<i class="fas fa-user-tie text-primary mr-2"></i>Мастера' +
                        '</h3>' +
                        '<div class="space-y-2 max-h-64 overflow-y-auto">' +
                            employeeCheckboxes +
                        '</div>' +
                    '</div>' +
                    '<div class="bg-white rounded-xl shadow-md p-4">' +
                        '<h3 class="text-lg font-semibold text-gray-800 mb-3">' +
                            '<i class="fas fa-filter text-purple-600 mr-2"></i>Статус' +
                        '</h3>' +
                        '<div class="space-y-2">' +
                            statusCheckboxes +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="lg:col-span-3">' +
                    '<div class="bg-white rounded-xl shadow-md p-4">' +
                        '<div id="calendar"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            this.renderAppointmentModal() +
        '</div>';
    },

    renderAppointmentModal() {
        const clients = Database.getAll('clients');
        const employees = Database.getAll('employees');
        const services = Database.getAll('services');
        const categories = Database.getAll('serviceCategories');

        const clientOptions = clients.map(c => 
            '<option value="' + c.id + '">' + c.name + ' (' + c.phone + ')</option>'
        ).join('');

        const serviceOptions = categories.map(cat => {
            const catServices = services.filter(s => s.categoryId === cat.id);
            return '<optgroup label="' + cat.name + '">' +
                catServices.map(s => 
                    '<option value="' + s.id + '" data-duration="' + s.duration + '">' + 
                    s.name + ' - ' + s.price + ' ₽ (' + s.duration + ' мин)</option>'
                ).join('') +
                '</optgroup>';
        }).join('');

        const employeeOptions = employees.map(e =>
            '<option value="' + e.id + '">' + e.name + ' - ' + e.position + '</option>'
        ).join('');

        return '<div id="appointment-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 overflow-y-auto">' +
            '<div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8">' +
                '<div class="p-6">' +
                    '<div class="flex items-center justify-between mb-6">' +
                        '<h2 class="text-2xl font-bold text-gray-800" id="modal-title">Новая запись</h2>' +
                        '<button onclick="Appointments.closeModal()" class="text-gray-400 hover:text-gray-600">' +
                            '<i class="fas fa-times text-2xl"></i>' +
                        '</button>' +
                    '</div>' +
                    '<form id="appointment-form" onsubmit="Appointments.save(event)" class="space-y-4">' +
                        '<input type="hidden" id="appointment-id">' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Клиент <span class="text-red-500">*</span></label>' +
                            '<select name="clientId" id="appointment-client" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                                '<option value="">Выберите клиента</option>' + clientOptions +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Услуга <span class="text-red-500">*</span></label>' +
                            '<select name="serviceId" id="appointment-service" required onchange="Appointments.onServiceChange()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                                '<option value="">Выберите услугу</option>' + serviceOptions +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Мастер <span class="text-red-500">*</span></label>' +
                            '<select name="employeeId" id="appointment-employee" required onchange="Appointments.checkAvailability()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                                '<option value="">Выберите мастера</option>' + employeeOptions +
                            '</select>' +
                        '</div>' +
                        '<div class="grid grid-cols-2 gap-4">' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700 mb-2">Дата <span class="text-red-500">*</span></label>' +
                                '<input type="date" name="date" id="appointment-date" required onchange="Appointments.checkAvailability()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700 mb-2">Время <span class="text-red-500">*</span></label>' +
                                '<input type="time" name="time" id="appointment-time" required onchange="Appointments.checkAvailability()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                            '</div>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Длительность (мин)</label>' +
                            '<input type="number" id="appointment-duration" readonly class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">' +
                        '</div>' +
                        '<div id="availability-message"></div>' +
                        '<div id="time-suggestions"></div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Статус</label>' +
                            '<select name="status" id="appointment-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">' +
                                '<option value="pending">Ожидает</option>' +
                                '<option value="confirmed">Подтверждено</option>' +
                                '<option value="completed">Завершено</option>' +
                                '<option value="cancelled">Отменено</option>' +
                                '<option value="no-show">Не пришел</option>' +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-2">Примечания</label>' +
                            '<textarea name="notes" id="appointment-notes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"></textarea>' +
                        '</div>' +
                        '<div class="flex gap-4 pt-4">' +
                            '<button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                                '<i class="fas fa-save mr-2"></i>Сохранить' +
                            '</button>' +
                            '<button type="button" onclick="Appointments.closeModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">Отмена</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
        '</div>';
    },

    afterRender() {
        this.initCalendar();
    },

    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        try {
            if (typeof FullCalendar === 'undefined') {
                Toast.error('FullCalendar не загружен');
                return;
            }

            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'timeGridWeek',
                locale: 'ru',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridDay,timeGridWeek,dayGridMonth'
                },
                buttonText: {
                    today: 'Сегодня',
                    month: 'Месяц',
                    week: 'Неделя',
                    day: 'День'
                },
                slotMinTime: '08:00:00',
                slotMaxTime: '20:00:00',
                slotDuration: '00:30:00',
                height: 'auto',
                expandRows: true,
                weekends: true,
                allDaySlot: false,
                editable: true,
                eventDurationEditable: false,
                eventStartEditable: true,
                events: (info, successCallback) => {
                    successCallback(this.getFilteredEvents());
                },
                eventClick: (info) => this.edit(parseInt(info.event.id)),
                dateClick: (info) => {
                    if (info.view.type !== 'dayGridMonth') {
                        this.createAtTime(info.dateStr);
                    }
                },
                eventDrop: (info) => this.handleDrop(info)
            });

            this.calendar.render();
        } catch (error) {
            console.error('Error initializing calendar:', error);
            Toast.error('Ошибка при инициализации календаря');
        }
    },

    getFilteredEvents() {
        try {
            let appointments = Database.getAll('appointments');

            if (this.selectedEmployees.length > 0) {
                appointments = appointments.filter(a => this.selectedEmployees.includes(a.employeeId));
            }

            if (this.selectedStatuses.length > 0) {
                appointments = appointments.filter(a => this.selectedStatuses.includes(a.status));
            }

            return appointments.map(apt => {
                const client = Database.getById('clients', apt.clientId);
                const service = Database.getById('services', apt.serviceId);
                const startTime = apt.date + 'T' + apt.time;
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + (apt.duration || 60));

                return {
                    id: apt.id.toString(),
                    title: (client ? client.name : 'Клиент') + ' - ' + (service ? service.name : 'Услуга'),
                    start: startTime,
                    end: endTime.toISOString(),
                    backgroundColor: this.statusConfig[apt.status]?.color || '#6b7280',
                    borderColor: this.statusConfig[apt.status]?.color || '#6b7280'
                };
            });
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    },

    getStatistics() {
        try {
            const appointments = Database.getAll('appointments');
            const today = DateUtils.getCurrentDate();
            const weekStart = DateUtils.getStartOfWeek(today);
            const weekEnd = DateUtils.getEndOfWeek(today);
            const monthStart = DateUtils.getStartOfMonth(today);
            const monthEnd = DateUtils.getEndOfMonth(today);

            const todayCount = appointments.filter(a => a.date === today).length;
            const weekCount = appointments.filter(a => a.date >= weekStart && a.date <= weekEnd).length;
            const monthCount = appointments.filter(a => a.date >= monthStart && a.date <= monthEnd).length;

            const monthCancelled = appointments.filter(a => 
                a.date >= monthStart && a.date <= monthEnd && 
                (a.status === 'cancelled' || a.status === 'no-show')
            ).length;

            const cancellationRate = monthCount > 0 ? Math.round((monthCancelled / monthCount) * 100) : 0;

            const employees = Database.getAll('employees');
            const workMinutes = employees.length * 8 * 60 * 22;
            const bookedMinutes = appointments
                .filter(a => a.date >= monthStart && a.date <= monthEnd && a.status !== 'cancelled')
                .reduce((sum, a) => sum + (a.duration || 60), 0);
            const employeeLoad = workMinutes > 0 ? Math.round((bookedMinutes / workMinutes) * 100) : 0;

            return { today: todayCount, week: weekCount, month: monthCount, cancellationRate, employeeLoad };
        } catch (error) {
            console.error('Error calculating statistics:', error);
            return { today: 0, week: 0, month: 0, cancellationRate: 0, employeeLoad: 0 };
        }
    },

    toggleEmployee(id) {
        const index = this.selectedEmployees.indexOf(id);
        if (index > -1) {
            this.selectedEmployees.splice(index, 1);
        } else {
            this.selectedEmployees.push(id);
        }
        if (this.calendar) this.calendar.refetchEvents();
    },

    toggleStatus(status) {
        const index = this.selectedStatuses.indexOf(status);
        if (index > -1) {
            this.selectedStatuses.splice(index, 1);
        } else {
            this.selectedStatuses.push(status);
        }
        if (this.calendar) this.calendar.refetchEvents();
    },

    showAddModal() {
        document.getElementById('modal-title').textContent = 'Новая запись';
        document.getElementById('appointment-form').reset();
        document.getElementById('appointment-id').value = '';
        document.getElementById('appointment-date').value = DateUtils.getCurrentDate();
        document.getElementById('appointment-status').value = 'pending';
        document.getElementById('availability-message').innerHTML = '';
        document.getElementById('time-suggestions').innerHTML = '';
        document.getElementById('appointment-modal').classList.remove('hidden');
    },

    createAtTime(dateStr) {
        this.showAddModal();
        const [date, time] = dateStr.split('T');
        document.getElementById('appointment-date').value = date;
        if (time) {
            document.getElementById('appointment-time').value = time.substring(0, 5);
        }
    },

    edit(id) {
        try {
            const apt = Database.getById('appointments', id);
            if (!apt) {
                Toast.error('Запись не найдена');
                return;
            }

            document.getElementById('modal-title').textContent = 'Редактировать запись';
            document.getElementById('appointment-id').value = apt.id;
            document.getElementById('appointment-client').value = apt.clientId;
            document.getElementById('appointment-service').value = apt.serviceId;
            document.getElementById('appointment-employee').value = apt.employeeId;
            document.getElementById('appointment-date').value = apt.date;
            document.getElementById('appointment-time').value = apt.time;
            document.getElementById('appointment-duration').value = apt.duration;
            document.getElementById('appointment-status').value = apt.status;
            document.getElementById('appointment-notes').value = apt.notes || '';
            document.getElementById('appointment-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Error editing appointment:', error);
            Toast.error('Ошибка при редактировании записи');
        }
    },

    save(event) {
        event.preventDefault();

        try {
            const form = document.getElementById('appointment-form');
            const formData = new FormData(form);
            const id = document.getElementById('appointment-id').value;

            const data = {
                clientId: parseInt(formData.get('clientId')),
                employeeId: parseInt(formData.get('employeeId')),
                serviceId: parseInt(formData.get('serviceId')),
                date: formData.get('date'),
                time: formData.get('time'),
                duration: parseInt(document.getElementById('appointment-duration').value),
                status: formData.get('status'),
                notes: formData.get('notes') || ''
            };

            // Validate
            const availability = Database.checkEmployeeAvailability(
                data.employeeId, data.date, data.time, data.duration, id ? parseInt(id) : null
            );

            if (!availability.available) {
                Toast.error(availability.reason);
                return;
            }

            // Validate past date
            const appointmentDateTime = new Date(data.date + 'T' + data.time);
            const now = new Date();
            if (appointmentDateTime < now && !id) {
                Toast.error('Нельзя создать запись в прошлом');
                return;
            }

            if (id) {
                Database.update('appointments', parseInt(id), data);
                Toast.success('Запись обновлена');
            } else {
                data.createdAt = new Date().toISOString();
                data.updatedAt = new Date().toISOString();
                Database.create('appointments', data);
                Toast.success('Запись создана');
            }

            this.closeModal();
            if (this.calendar) this.calendar.refetchEvents();
            App.refresh();
        } catch (error) {
            console.error('Error saving appointment:', error);
            Toast.error('Ошибка при сохранении записи');
        }
    },

    closeModal() {
        document.getElementById('appointment-modal').classList.add('hidden');
    },

    onServiceChange() {
        const select = document.getElementById('appointment-service');
        const option = select.options[select.selectedIndex];
        if (option) {
            const duration = option.getAttribute('data-duration');
            if (duration) {
                document.getElementById('appointment-duration').value = duration;
            }
        }
        this.checkAvailability();
    },

    checkAvailability() {
        const employeeId = parseInt(document.getElementById('appointment-employee').value);
        const date = document.getElementById('appointment-date').value;
        const time = document.getElementById('appointment-time').value;
        const duration = parseInt(document.getElementById('appointment-duration').value);
        const id = document.getElementById('appointment-id').value;

        if (!employeeId || !date || !time || !duration) return;

        const availability = Database.checkEmployeeAvailability(
            employeeId, date, time, duration, id ? parseInt(id) : null
        );

        const messageDiv = document.getElementById('availability-message');
        if (availability.available) {
            messageDiv.innerHTML = '<div class="p-3 bg-green-100 text-green-800 rounded-lg"><i class="fas fa-check-circle mr-2"></i>' + availability.reason + '</div>';
        } else {
            messageDiv.innerHTML = '<div class="p-3 bg-red-100 text-red-800 rounded-lg"><i class="fas fa-exclamation-circle mr-2"></i>' + availability.reason + '</div>';
            this.showTimeSuggestions(employeeId, date, duration);
        }
    },

    showTimeSuggestions(employeeId, date, duration) {
        const slots = Database.getAvailableTimeSlots(employeeId, date, duration, 5);
        const suggestionsDiv = document.getElementById('time-suggestions');

        if (slots.length > 0) {
            suggestionsDiv.innerHTML = '<div class="p-3 bg-blue-50 rounded-lg">' +
                '<p class="text-sm font-medium text-blue-900 mb-2">Ближайшие свободные слоты:</p>' +
                '<div class="flex flex-wrap gap-2">' +
                slots.map(slot => 
                    '<button type="button" onclick="document.getElementById(\'appointment-time\').value=\'' + slot + '\';Appointments.checkAvailability()" ' +
                    'class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">' + slot + '</button>'
                ).join('') +
                '</div>' +
            '</div>';
        } else {
            suggestionsDiv.innerHTML = '';
        }
    },

    handleDrop(info) {
        try {
            const id = parseInt(info.event.id);
            const newDate = info.event.start.toISOString().split('T')[0];
            const newTime = info.event.start.toTimeString().substring(0, 5);

            const apt = Database.getById('appointments', id);
            if (!apt) {
                info.revert();
                Toast.error('Запись не найдена');
                return;
            }

            const availability = Database.checkEmployeeAvailability(
                apt.employeeId, newDate, newTime, apt.duration, id
            );

            if (!availability.available) {
                info.revert();
                Toast.error(availability.reason);
                return;
            }

            Database.update('appointments', id, { date: newDate, time: newTime });
            Toast.success('Запись перенесена');
        } catch (error) {
            info.revert();
            console.error('Error moving appointment:', error);
            Toast.error('Ошибка при переносе записи');
        }
    },

    generateTestData() {
        if (confirm('Сгенерировать расписание и 100 тестовых записей?')) {
            try {
                Database.generateEmployeeSchedules();
                Database.generateTestAppointments(100);
                Toast.success('Тестовые данные созданы');
                if (this.calendar) this.calendar.refetchEvents();
                App.refresh();
            } catch (error) {
                console.error('Error generating test data:', error);
                Toast.error('Ошибка при генерации данных');
            }
        }
    }
};
