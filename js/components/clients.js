/**
 * Clients component - Full-featured client management system
 */

const Clients = {
    currentPage: 1,
    itemsPerPage: 20,
    sortColumn: 'id',
    sortDirection: 'asc',
    searchQuery: '',
    viewingClientId: null,

    /**
     * Render clients page
     */
    render() {
        const clients = this.getFilteredAndSortedClients();
        const totalPages = Math.ceil(clients.length / this.itemsPerPage);
        const paginatedClients = this.getPaginatedClients(clients);
        const stats = this.getStatistics();

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">
                            <i class="fas fa-users text-primary mr-3"></i>
                            База клиентов
                        </h1>
                        <p class="text-gray-500 mt-1">Управление клиентской базой салона</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="Clients.showAddModal()" class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">
                            <i class="fas fa-user-plus mr-2"></i>
                            Добавить клиента
                        </button>
                        <button onclick="Clients.generateTestData()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                            <i class="fas fa-database mr-2"></i>
                            Генерировать тестовые данные
                        </button>
                        <button onclick="Clients.exportToCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-file-export mr-2"></i>
                            Экспорт CSV
                        </button>
                        <button onclick="document.getElementById('csv-import-input').click()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-file-import mr-2"></i>
                            Импорт CSV
                        </button>
                        <input type="file" id="csv-import-input" accept=".csv" class="hidden" onchange="Clients.importFromCSV(event)">
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">Всего клиентов</p>
                                <p class="text-3xl font-bold mt-1">${stats.total}</p>
                            </div>
                            <i class="fas fa-users text-4xl opacity-30"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">Новых за месяц</p>
                                <p class="text-3xl font-bold mt-1">${stats.newThisMonth}</p>
                            </div>
                            <i class="fas fa-user-plus text-4xl opacity-30"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">Активных</p>
                                <p class="text-3xl font-bold mt-1">${stats.active}</p>
                            </div>
                            <i class="fas fa-user-check text-4xl opacity-30"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">Средний чек</p>
                                <p class="text-3xl font-bold mt-1">${stats.avgCheck.toLocaleString('ru-RU', {maximumFractionDigits: 0})} ₽</p>
                            </div>
                            <i class="fas fa-ruble-sign text-4xl opacity-30"></i>
                        </div>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div class="bg-white rounded-xl shadow-md p-4">
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1 relative">
                            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                id="client-search"
                                placeholder="Поиск по имени или телефону..."
                                value="${this.searchQuery}"
                                class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                oninput="Clients.handleSearch(this.value)">
                            ${this.searchQuery ? `
                                <button onclick="Clients.clearSearch()" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                        <button onclick="Clients.sendMassSMS()" class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition whitespace-nowrap">
                            <i class="fas fa-sms mr-2"></i>
                            Массовая рассылка
                        </button>
                    </div>
                </div>

                <!-- Clients Table -->
                <div class="bg-white rounded-xl shadow-md overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gradient-to-r from-primary to-secondary text-white">
                                <tr>
                                    ${this.renderTableHeader('id', 'ID')}
                                    ${this.renderTableHeader('name', 'ФИО')}
                                    ${this.renderTableHeader('phone', 'Телефон')}
                                    ${this.renderTableHeader('email', 'Email')}
                                    ${this.renderTableHeader('birthdate', 'Дата рождения')}
                                    ${this.renderTableHeader('discount', 'Скидка %')}
                                    ${this.renderTableHeader('totalVisits', 'Посещений')}
                                    ${this.renderTableHeader('lastVisit', 'Последнее посещение')}
                                    <th class="px-6 py-4 text-left text-sm font-semibold">Действия</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${this.renderTableRows(paginatedClients)}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    ${totalPages > 1 ? this.renderPagination(totalPages) : ''}
                </div>
            </div>

            <!-- Add/Edit Modal -->
            ${this.renderClientModal()}

            <!-- Client Card Modal -->
            ${this.renderClientCardModal()}
        `;
    },

    /**
     * Render table header with sorting
     */
    renderTableHeader(column, title) {
        const isSorted = this.sortColumn === column;
        const icon = isSorted
            ? (this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
            : 'fa-sort';

        return `
            <th class="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-white hover:bg-opacity-10 transition" onclick="Clients.sortBy('${column}')">
                <div class="flex items-center gap-2">
                    <span>${title}</span>
                    <i class="fas ${icon} text-xs"></i>
                </div>
            </th>
        `;
    },

    /**
     * Render table rows
     */
    renderTableRows(clients) {
        if (clients.length === 0) {
            return `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                        <p class="text-lg">Клиенты не найдены</p>
                        <p class="text-sm mt-2">Попробуйте изменить параметры поиска или добавьте нового клиента</p>
                    </td>
                </tr>
            `;
        }

        return clients.map(client => {
            const avgCheck = client.totalVisits > 0 ? (client.totalSpent / client.totalVisits) : 0;

            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 text-sm text-gray-600">#${client.id}</td>
                    <td class="px-6 py-4">
                        <div class="font-medium text-gray-800">${client.name}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${client.phone}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${client.email || '—'}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">
                        ${client.birthdate ? DateUtils.formatDate(client.birthdate) : '—'}
                    </td>
                    <td class="px-6 py-4">
                        ${client.discount ? `
                            <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                ${client.discount}%
                            </span>
                        ` : '—'}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            ${client.totalVisits || 0}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">
                        ${client.lastVisit ? DateUtils.formatDate(client.lastVisit) : 'Нет данных'}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <button onclick="Clients.viewCard(${client.id})" class="text-blue-600 hover:text-blue-800 transition" title="Просмотр">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="Clients.edit(${client.id})" class="text-green-600 hover:text-green-800 transition" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="Clients.delete(${client.id})" class="text-red-600 hover:text-red-800 transition" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Render pagination
     */
    renderPagination(totalPages) {
        const maxButtons = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        let pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return `
            <div class="px-6 py-4 bg-gray-50 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="text-sm text-gray-600">
                    Показано ${((this.currentPage - 1) * this.itemsPerPage) + 1} - ${Math.min(this.currentPage * this.itemsPerPage, this.getFilteredAndSortedClients().length)} из ${this.getFilteredAndSortedClients().length} клиентов
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick="Clients.goToPage(${this.currentPage - 1})"
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-chevron-left"></i>
                    </button>

                    ${startPage > 1 ? `
                        <button onclick="Clients.goToPage(1)" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">1</button>
                        ${startPage > 2 ? '<span class="px-2">...</span>' : ''}
                    ` : ''}

                    ${pages.map(page => `
                        <button
                            onclick="Clients.goToPage(${page})"
                            class="px-3 py-2 border rounded-lg transition ${page === this.currentPage ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-100'}">
                            ${page}
                        </button>
                    `).join('')}

                    ${endPage < totalPages ? `
                        ${endPage < totalPages - 1 ? '<span class="px-2">...</span>' : ''}
                        <button onclick="Clients.goToPage(${totalPages})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">${totalPages}</button>
                    ` : ''}

                    <button
                        onclick="Clients.goToPage(${this.currentPage + 1})"
                        ${this.currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render client form modal
     */
    renderClientModal() {
        return `
            <div id="client-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-up">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold text-gray-800" id="modal-title">Новый клиент</h2>
                            <button onclick="Clients.closeModal()" class="text-gray-400 hover:text-gray-600 transition">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>

                        <form id="client-form" class="space-y-4" onsubmit="Clients.save(event)">
                            <input type="hidden" id="client-id">

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    ФИО <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="name" id="client-name" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Иванова Мария Петровна">
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Телефон <span class="text-red-500">*</span>
                                    </label>
                                    <input type="tel" name="phone" id="client-phone" required
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="+7 (999) 123-45-67">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input type="email" name="email" id="client-email"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="maria@example.com">
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Дата рождения</label>
                                    <input type="date" name="birthdate" id="client-birthdate"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Скидка (%)</label>
                                    <input type="number" name="discount" id="client-discount" min="0" max="50" value="0"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Примечания</label>
                                <textarea name="notes" id="client-notes" rows="3"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Особые пожелания, аллергии и т.д."></textarea>
                            </div>

                            <div class="flex gap-4 pt-4">
                                <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">
                                    <i class="fas fa-save mr-2"></i>
                                    Сохранить
                                </button>
                                <button type="button" onclick="Clients.closeModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render client card modal (to be implemented in next part)
     */
    renderClientCardModal() {
        return `<div id="client-card-modal" class="hidden"></div>`;
    },

    /**
     * Get filtered and sorted clients
     */
    getFilteredAndSortedClients() {
        try {
            let clients = Database.getAll('clients');

            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                clients = clients.filter(client =>
                    client.name.toLowerCase().includes(query) ||
                    client.phone.includes(query) ||
                    (client.email && client.email.toLowerCase().includes(query))
                );
            }

            // Apply sorting
            clients.sort((a, b) => {
                let aVal = a[this.sortColumn];
                let bVal = b[this.sortColumn];

                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = '';
                if (bVal === null || bVal === undefined) bVal = '';

                // Convert to strings for comparison if needed
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            return clients;
        } catch (error) {
            console.error('Error filtering/sorting clients:', error);
            Toast.error('Ошибка при фильтрации клиентов');
            return [];
        }
    },

    /**
     * Get paginated clients
     */
    getPaginatedClients(clients) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return clients.slice(start, end);
    },

    /**
     * Get statistics
     */
    getStatistics() {
        try {
            const clients = Database.getAll('clients');
            const now = new Date();
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const monthAgoStr = monthAgo.toISOString().split('T')[0];

            const newThisMonth = clients.filter(c => c.registrationDate >= monthAgoStr).length;

            // Active clients (visited in last 90 days)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];
            const active = clients.filter(c => c.lastVisit && c.lastVisit >= ninetyDaysAgoStr).length;

            // Average check
            const totalSpent = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
            const totalVisits = clients.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
            const avgCheck = totalVisits > 0 ? totalSpent / totalVisits : 0;

            return {
                total: clients.length,
                newThisMonth,
                active,
                avgCheck
            };
        } catch (error) {
            console.error('Error calculating statistics:', error);
            return { total: 0, newThisMonth: 0, active: 0, avgCheck: 0 };
        }
    },

    /**
     * After render callback
     */
    afterRender() {
        this.setupPhoneMask();
    },

    /**
     * Setup phone number mask
     */
    setupPhoneMask() {
        const phoneInput = document.getElementById('client-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('8')) value = '7' + value.slice(1);
                if (value.startsWith('7')) value = value.slice(1);

                let formatted = '+7';
                if (value.length > 0) formatted += ` (${value.slice(0, 3)}`;
                if (value.length >= 4) formatted += `) ${value.slice(3, 6)}`;
                if (value.length >= 7) formatted += `-${value.slice(6, 8)}`;
                if (value.length >= 9) formatted += `-${value.slice(8, 10)}`;

                e.target.value = formatted;
            });
        }
    },

    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQuery = query;
        this.currentPage = 1;
        App.refresh();
    },

    /**
     * Clear search
     */
    clearSearch() {
        this.searchQuery = '';
        this.currentPage = 1;
        App.refresh();
    },

    /**
     * Sort by column
     */
    sortBy(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        App.refresh();
    },

    /**
     * Go to page
     */
    goToPage(page) {
        const clients = this.getFilteredAndSortedClients();
        const totalPages = Math.ceil(clients.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            App.refresh();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    /**
     * Show add modal
     */
    showAddModal() {
        document.getElementById('modal-title').textContent = 'Новый клиент';
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = '';
        document.getElementById('client-discount').value = '0';
        document.getElementById('client-modal').classList.remove('hidden');
    },

    /**
     * Edit client
     */
    edit(id) {
        try {
            const client = Database.getById('clients', id);
            if (!client) {
                Toast.error('Клиент не найден');
                return;
            }

            document.getElementById('modal-title').textContent = 'Редактировать клиента';
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-birthdate').value = client.birthdate || '';
            document.getElementById('client-discount').value = client.discount || 0;
            document.getElementById('client-notes').value = client.notes || '';
            document.getElementById('client-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Error editing client:', error);
            Toast.error('Ошибка при редактировании клиента');
        }
    },

    /**
     * Save client
     */
    save(event) {
        event.preventDefault();

        try {
            const form = document.getElementById('client-form');
            const formData = new FormData(form);
            const id = document.getElementById('client-id').value;

            // Validate phone uniqueness
            const phone = formData.get('phone');
            const clients = Database.getAll('clients');
            const existingClient = clients.find(c => c.phone === phone && c.id !== parseInt(id));

            if (existingClient) {
                Toast.error('Клиент с таким номером телефона уже существует');
                return;
            }

            const data = {
                name: formData.get('name').trim(),
                phone: phone,
                email: formData.get('email').trim() || '',
                birthdate: formData.get('birthdate') || '',
                discount: parseInt(formData.get('discount')) || 0,
                notes: formData.get('notes').trim() || ''
            };

            // Validate discount range
            if (data.discount < 0 || data.discount > 50) {
                Toast.error('Скидка должна быть от 0 до 50%');
                return;
            }

            if (id) {
                Database.update('clients', parseInt(id), data);
                Toast.success('Клиент успешно обновлен');
            } else {
                data.registrationDate = DateUtils.getCurrentDate();
                data.totalVisits = 0;
                data.totalSpent = 0;
                data.lastVisit = null;
                Database.create('clients', data);
                Toast.success('Клиент успешно добавлен');
            }

            this.closeModal();
            App.refresh();
        } catch (error) {
            console.error('Error saving client:', error);
            Toast.error('Ошибка при сохранении клиента');
        }
    },

    /**
     * Delete client
     */
    delete(id) {
        if (confirm('Вы уверены, что хотите удалить этого клиента? Это действие нельзя отменить.')) {
            try {
                Database.delete('clients', id);
                Toast.success('Клиент успешно удален');
                App.refresh();
            } catch (error) {
                console.error('Error deleting client:', error);
                Toast.error('Ошибка при удалении клиента');
            }
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('client-modal').classList.add('hidden');
    },

    /**
     * View client card (placeholder - to be implemented)
     */
    viewCard(id) {
        this.viewingClientId = id;
        Toast.info('Карточка клиента будет реализована в следующей части');
    },

    /**
     * Generate test data
     */
    generateTestData() {
        if (confirm('Добавить 50 тестовых клиентов в базу данных?')) {
            try {
                Database.generateTestClients(50);
                Toast.success('50 тестовых клиентов успешно добавлены');
                App.refresh();
            } catch (error) {
                console.error('Error generating test data:', error);
                Toast.error('Ошибка при генерации тестовых данных');
            }
        }
    },

    /**
     * Export to CSV
     */
    exportToCSV() {
        try {
            const clients = Database.getAll('clients');

            // CSV header
            const header = ['ID', 'ФИО', 'Телефон', 'Email', 'Дата рождения', 'Скидка %', 'Посещений', 'Потрачено', 'Последнее посещение', 'Примечания'];

            // CSV rows
            const rows = clients.map(client => [
                client.id,
                client.name,
                client.phone,
                client.email || '',
                client.birthdate || '',
                client.discount || 0,
                client.totalVisits || 0,
                client.totalSpent || 0,
                client.lastVisit || '',
                (client.notes || '').replace(/"/g, '""')
            ]);

            // Create CSV content
            const csvContent = [
                header.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create download link
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            Toast.success('Список клиентов экспортирован');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            Toast.error('Ошибка при экспорте данных');
        }
    },

    /**
     * Import from CSV
     */
    importFromCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');

                    // Skip header
                    const dataLines = lines.slice(1).filter(line => line.trim());

                    let imported = 0;
                    let errors = 0;

                    dataLines.forEach(line => {
                        try {
                            // Simple CSV parsing (doesn't handle all edge cases)
                            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

                            if (values.length >= 3) {
                                const data = {
                                    name: values[1],
                                    phone: values[2],
                                    email: values[3] || '',
                                    birthdate: values[4] || '',
                                    discount: parseInt(values[5]) || 0,
                                    totalVisits: parseInt(values[6]) || 0,
                                    totalSpent: parseFloat(values[7]) || 0,
                                    lastVisit: values[8] || null,
                                    notes: values[9] || '',
                                    registrationDate: DateUtils.getCurrentDate()
                                };

                                Database.create('clients', data);
                                imported++;
                            }
                        } catch (err) {
                            errors++;
                            console.error('Error parsing line:', err);
                        }
                    });

                    Toast.success(`Импортировано ${imported} клиентов${errors > 0 ? `, ошибок: ${errors}` : ''}`);
                    App.refresh();
                } catch (error) {
                    console.error('Error parsing CSV:', error);
                    Toast.error('Ошибка при чтении CSV файла');
                }
            };

            reader.readAsText(file, 'UTF-8');
        } catch (error) {
            console.error('Error importing CSV:', error);
            Toast.error('Ошибка при импорте данных');
        }

        // Reset input
        event.target.value = '';
    },

    /**
     * Send mass SMS (placeholder)
     */
    sendMassSMS() {
        const clients = this.getFilteredAndSortedClients();
        console.log(`Отправка SMS ${clients.length} клиентам:`);
        clients.forEach(client => {
            console.log(`  - ${client.name} (${client.phone})`);
        });
        Toast.info(`Массовая рассылка запущена для ${clients.length} клиентов (заглушка - проверьте консоль)`);
    }
};
