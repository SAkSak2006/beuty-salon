/**
 * Services component with advanced management features
 */

const Services = {
    searchQuery: '',
    selectedCategoryFilter: null,
    collapsedCategories: new Set(),
    draggedService: null,
    selectedServicesForCalculator: new Set(),

    /**
     * Render services page
     */
    render() {
        try {
            const categories = Database.getAll('serviceCategories');
            const allServices = Database.getAll('services');

            const stats = this.calculateStatistics(allServices);

            return '<div class="services-page space-y-6">' +
                '<!-- Header -->' +
                '<div class="flex items-center justify-between">' +
                    '<h1 class="text-3xl font-bold text-gray-800">' +
                        '<i class="fas fa-cut text-primary mr-3"></i>' +
                        'Управление услугами' +
                    '</h1>' +
                    '<div class="flex space-x-3">' +
                        '<button onclick="Services.showCalculator()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition" title="Калькулятор услуг">' +
                            '<i class="fas fa-calculator mr-2"></i>Калькулятор' +
                        '</button>' +
                        '<button onclick="Services.showBulkPriceChangeModal()" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition" title="Массовое изменение цен">' +
                            '<i class="fas fa-percentage mr-2"></i>Цены' +
                        '</button>' +
                        '<button onclick="Services.generateExtendedServices()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">' +
                            '<i class="fas fa-database mr-2"></i>Генерировать' +
                        '</button>' +
                        '<button onclick="Services.showAddServiceModal()" class="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                            '<i class="fas fa-plus mr-2"></i>Новая услуга' +
                        '</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Statistics Cards -->' +
                '<div class="grid grid-cols-1 md:grid-cols-4 gap-4">' +
                    this.renderStatCard('Всего услуг', stats.total, 'fa-list', 'from-blue-500 to-blue-600') +
                    this.renderStatCard('Активных', stats.active, 'fa-check-circle', 'from-green-500 to-green-600') +
                    this.renderStatCard('Средняя цена', stats.avgPrice + ' ₽', 'fa-ruble-sign', 'from-yellow-500 to-yellow-600') +
                    this.renderStatCard('Общая выручка', stats.totalRevenue + ' ₽', 'fa-chart-line', 'from-purple-500 to-purple-600') +
                '</div>' +

                '<!-- Search and Filters -->' +
                '<div class="bg-white rounded-xl shadow-md p-4">' +
                    '<div class="flex flex-col md:flex-row gap-4">' +
                        '<div class="flex-1">' +
                            '<div class="relative">' +
                                '<i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>' +
                                '<input type="text" id="service-search" placeholder="Поиск услуг..." ' +
                                    'class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" ' +
                                    'oninput="Services.handleSearch(this.value)">' +
                            '</div>' +
                        '</div>' +
                        '<div>' +
                            '<select id="category-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" ' +
                                'onchange="Services.handleCategoryFilter(this.value)">' +
                                '<option value="">Все категории</option>' +
                                categories.map(function(cat) {
                                    return '<option value="' + cat.id + '">' + cat.name + '</option>';
                                }).join('') +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Services Tree View -->' +
                '<div class="space-y-4">' +
                    categories.map(function(category) {
                        return Services.renderCategorySection(category);
                    }).join('') +
                '</div>' +

                this.renderModals() +
            '</div>';
        } catch (error) {
            console.error('Error rendering services:', error);
            Toast.error('Ошибка при загрузке услуг');
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
     * Calculate statistics
     */
    calculateStatistics(services) {
        const active = services.filter(function(s) { return s.isActive; });
        const total = services.length;
        const avgPrice = total > 0 ? Math.round(services.reduce(function(sum, s) { return sum + s.price; }, 0) / total) : 0;
        const totalRevenue = services.reduce(function(sum, s) { return sum + (s.price || 0); }, 0);

        return {
            total: total,
            active: active.length,
            avgPrice: avgPrice,
            totalRevenue: totalRevenue
        };
    },

    /**
     * Render category section with collapsible tree
     */
    renderCategorySection(category) {
        const allServices = Database.getAll('services')
            .filter(function(s) { return s.categoryId === category.id; })
            .sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });

        // Apply search filter
        const services = allServices.filter(function(s) {
            if (Services.searchQuery) {
                const query = Services.searchQuery.toLowerCase();
                return s.name.toLowerCase().indexOf(query) !== -1 ||
                       (s.description && s.description.toLowerCase().indexOf(query) !== -1);
            }
            return true;
        });

        // Apply category filter
        if (Services.selectedCategoryFilter && category.id !== parseInt(Services.selectedCategoryFilter)) {
            return '';
        }

        const isCollapsed = Services.collapsedCategories.has(category.id);
        const activeCount = services.filter(function(s) { return s.isActive; }).length;
        const totalRevenue = services.reduce(function(sum, s) { return sum + (s.price || 0); }, 0);

        return '<div class="bg-white rounded-xl shadow-md overflow-hidden service-category" data-category-id="' + category.id + '">' +
            '<div class="p-4 cursor-pointer" style="background: linear-gradient(135deg, ' + category.color + 'dd, ' + category.color + '99);" ' +
                'onclick="Services.toggleCategory(' + category.id + ')">' +
                '<div class="flex items-center justify-between">' +
                    '<div class="flex items-center space-x-3 text-white">' +
                        '<i class="fas ' + (isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down') + ' text-lg transition-transform"></i>' +
                        '<i class="fas ' + category.icon + ' text-3xl"></i>' +
                        '<h2 class="text-2xl font-bold">' + category.name + '</h2>' +
                        '<span class="px-3 py-1 bg-white bg-opacity-30 rounded-full text-sm">' +
                            activeCount + '/' + services.length + ' активно' +
                        '</span>' +
                        '<span class="px-3 py-1 bg-white bg-opacity-30 rounded-full text-sm">' +
                            '<i class="fas fa-ruble-sign mr-1"></i>' + totalRevenue + ' ₽' +
                        '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="p-6 ' + (isCollapsed ? 'hidden' : '') + '" id="category-content-' + category.id + '">' +
                (services.length > 0 ?
                    '<div class="space-y-3">' +
                        services.map(function(service) {
                            return Services.renderServiceRow(service);
                        }).join('') +
                    '</div>'
                    :
                    '<p class="text-center text-gray-500 py-8">В этой категории нет услуг</p>'
                ) +
            '</div>' +
        '</div>';
    },

    /**
     * Render service row with drag & drop
     */
    renderServiceRow(service) {
        const materials = (service.requiredMaterials || []).map(function(matId) {
            const mat = Database.getById('inventory', matId);
            return mat ? mat.name : null;
        }).filter(function(name) { return name; });

        const activeClass = service.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
        const activeIcon = service.isActive ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-400';

        return '<div class="service-row border-2 ' + activeClass + ' rounded-lg p-4 transition hover:shadow-md" ' +
                'data-service-id="' + service.id + '" ' +
                'draggable="true" ' +
                'ondragstart="Services.handleDragStart(event, ' + service.id + ')" ' +
                'ondragover="Services.handleDragOver(event)" ' +
                'ondrop="Services.handleDrop(event, ' + service.id + ')">' +
            '<div class="flex items-center justify-between">' +
                '<div class="flex items-center space-x-4 flex-1">' +
                    '<i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>' +
                    '<i class="fas ' + activeIcon + ' text-xl"></i>' +
                    '<div class="flex-1">' +
                        '<h3 class="font-bold text-gray-800 text-lg">' + service.name + '</h3>' +
                        (service.description ?
                            '<p class="text-sm text-gray-600 mt-1">' + service.description + '</p>'
                            : ''
                        ) +
                        (materials.length > 0 ?
                            '<div class="mt-2 flex items-center gap-2">' +
                                '<i class="fas fa-box text-xs text-gray-500"></i>' +
                                '<span class="text-xs text-gray-600">' + materials.join(', ') + '</span>' +
                            '</div>'
                            : ''
                        ) +
                    '</div>' +
                '</div>' +

                '<div class="flex items-center space-x-6">' +
                    '<div class="text-center">' +
                        '<div class="inline-flex items-center px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition" ' +
                            'onclick="Services.showInlinePriceEdit(' + service.id + ', ' + service.price + ')" ' +
                            'title="Нажмите для изменения цены">' +
                            '<i class="fas fa-ruble-sign text-primary mr-2"></i>' +
                            '<span class="text-xl font-bold text-gray-800" id="service-price-' + service.id + '">' + service.price + '</span>' +
                            '<span class="text-sm text-gray-600 ml-1">₽</span>' +
                        '</div>' +
                        '<button onclick="Services.showPriceHistory(' + service.id + ')" ' +
                            'class="mt-1 text-xs text-blue-600 hover:text-blue-800" title="История цен">' +
                            '<i class="fas fa-history mr-1"></i>История' +
                        '</button>' +
                    '</div>' +

                    '<div class="text-center">' +
                        '<div class="px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">' +
                            '<i class="fas fa-clock text-blue-600 mr-2"></i>' +
                            '<span class="font-semibold text-gray-800">' + service.duration + '</span>' +
                            '<span class="text-sm text-gray-600"> мин</span>' +
                        '</div>' +
                    '</div>' +

                    '<div class="flex space-x-2">' +
                        '<label class="relative inline-flex items-center cursor-pointer" title="Активна/Неактивна">' +
                            '<input type="checkbox" class="sr-only peer" ' +
                                (service.isActive ? 'checked' : '') + ' ' +
                                'onchange="Services.toggleServiceActive(' + service.id + ', this.checked)">' +
                            '<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>' +
                        '</label>' +

                        '<button onclick="Services.copyService(' + service.id + ')" ' +
                            'class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition" title="Копировать">' +
                            '<i class="fas fa-copy"></i>' +
                        '</button>' +

                        '<button onclick="Services.editService(' + service.id + ')" ' +
                            'class="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition" title="Редактировать">' +
                            '<i class="fas fa-edit"></i>' +
                        '</button>' +

                        '<button onclick="Services.deleteService(' + service.id + ')" ' +
                            'class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition" title="Удалить">' +
                            '<i class="fas fa-trash"></i>' +
                        '</button>' +

                        '<button onclick="Services.toggleServiceForCalculator(' + service.id + ')" ' +
                            'class="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition ' + (Services.selectedServicesForCalculator.has(service.id) ? 'bg-green-100' : '') + '" ' +
                            'title="Добавить в калькулятор" id="calc-btn-' + service.id + '">' +
                            '<i class="fas fa-calculator"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    },

    /**
     * Render all modals
     */
    renderModals() {
        const categories = Database.getAll('serviceCategories');
        const inventory = Database.getAll('inventory');

        return '<!-- Service Modal -->' +
            '<div id="service-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800" id="service-modal-title">Новая услуга</h2>' +
                            '<button onclick="Services.closeServiceModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<form id="service-form" class="space-y-4">' +
                            '<input type="hidden" id="service-id">' +

                            '<div class="grid grid-cols-2 gap-4">' +
                                '<div class="col-span-2">' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Название услуги *</label>' +
                                    '<input type="text" id="service-name" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Категория *</label>' +
                                    '<select id="service-category" required ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                        '<option value="">Выберите категорию</option>' +
                                        categories.map(function(cat) {
                                            return '<option value="' + cat.id + '">' + cat.name + '</option>';
                                        }).join('') +
                                    '</select>' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">' +
                                        '<input type="checkbox" id="service-active" checked class="mr-2">' +
                                        'Услуга активна' +
                                    '</label>' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Цена (₽) *</label>' +
                                    '<input type="number" id="service-price" required min="0" step="10" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div>' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Длительность (мин) *</label>' +
                                    '<input type="number" id="service-duration" required min="0" step="5" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                '</div>' +

                                '<div class="col-span-2">' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Описание</label>' +
                                    '<textarea id="service-description" rows="3" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>' +
                                '</div>' +

                                '<div class="col-span-2">' +
                                    '<label class="block text-sm font-medium text-gray-700 mb-2">Требуемые материалы</label>' +
                                    '<select id="service-materials" multiple size="5" ' +
                                        'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                        inventory.map(function(item) {
                                            return '<option value="' + item.id + '">' + item.name + ' (' + item.category + ')</option>';
                                        }).join('') +
                                    '</select>' +
                                    '<p class="text-xs text-gray-500 mt-1">Удерживайте Ctrl (Cmd) для выбора нескольких</p>' +
                                '</div>' +
                            '</div>' +

                            '<div class="flex space-x-4 pt-4">' +
                                '<button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition">' +
                                    '<i class="fas fa-save mr-2"></i>Сохранить' +
                                '</button>' +
                                '<button type="button" onclick="Services.closeServiceModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Отмена' +
                                '</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Bulk Price Change Modal -->' +
            '<div id="bulk-price-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-md w-full animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">Массовое изменение цен</h2>' +
                            '<button onclick="Services.closeBulkPriceModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +

                        '<div class="space-y-4">' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700 mb-2">Изменить цены на:</label>' +
                                '<div class="flex space-x-2">' +
                                    '<input type="number" id="bulk-percentage" value="10" step="1" ' +
                                        'class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                    '<span class="flex items-center px-4 py-2 bg-gray-100 rounded-lg">%</span>' +
                                '</div>' +
                                '<p class="text-xs text-gray-500 mt-1">Положительное значение - повышение, отрицательное - понижение</p>' +
                            '</div>' +

                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700 mb-2">Категория (опционально)</label>' +
                                '<select id="bulk-category" ' +
                                    'class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                                    '<option value="">Все категории</option>' +
                                    categories.map(function(cat) {
                                        return '<option value="' + cat.id + '">' + cat.name + '</option>';
                                    }).join('') +
                                '</select>' +
                            '</div>' +

                            '<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">' +
                                '<p class="text-sm text-yellow-800">' +
                                    '<i class="fas fa-exclamation-triangle mr-2"></i>' +
                                    'Это действие изменит цены всех услуг выбранной категории' +
                                '</p>' +
                            '</div>' +

                            '<div class="flex space-x-4 pt-4">' +
                                '<button onclick="Services.applyBulkPriceChange()" class="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg transition">' +
                                    '<i class="fas fa-check mr-2"></i>Применить' +
                                '</button>' +
                                '<button onclick="Services.closeBulkPriceModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                                    'Отмена' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Price History Modal -->' +
            '<div id="price-history-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">История изменения цены</h2>' +
                            '<button onclick="Services.closePriceHistoryModal()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +
                        '<div id="price-history-content" class="overflow-y-auto max-h-96"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Service Calculator Modal -->' +
            '<div id="calculator-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-up">' +
                    '<div class="p-6">' +
                        '<div class="flex items-center justify-between mb-6">' +
                            '<h2 class="text-2xl font-bold text-gray-800">' +
                                '<i class="fas fa-calculator mr-2"></i>Калькулятор услуг' +
                            '</h2>' +
                            '<button onclick="Services.closeCalculator()" class="text-gray-400 hover:text-gray-600">' +
                                '<i class="fas fa-times text-2xl"></i>' +
                            '</button>' +
                        '</div>' +
                        '<div id="calculator-content"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    /**
     * After render callback
     */
    afterRender() {
        this.setupForms();
    },

    /**
     * Setup forms
     */
    setupForms() {
        const serviceForm = document.getElementById('service-form');
        if (serviceForm) {
            serviceForm.addEventListener('submit', function(e) {
                e.preventDefault();
                Services.saveService();
            });
        }
    },

    /**
     * Toggle category collapsed state
     */
    toggleCategory(categoryId) {
        if (this.collapsedCategories.has(categoryId)) {
            this.collapsedCategories.delete(categoryId);
        } else {
            this.collapsedCategories.add(categoryId);
        }
        App.refresh();
    },

    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQuery = query;
        App.refresh();
    },

    /**
     * Handle category filter
     */
    handleCategoryFilter(categoryId) {
        this.selectedCategoryFilter = categoryId || null;
        App.refresh();
    },

    /**
     * Drag and drop handlers
     */
    handleDragStart(event, serviceId) {
        this.draggedService = serviceId;
        event.dataTransfer.effectAllowed = 'move';
        event.target.style.opacity = '0.5';
    },

    handleDragOver(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.dataTransfer.dropEffect = 'move';
        return false;
    },

    handleDrop(event, targetServiceId) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }

        event.target.closest('.service-row').style.opacity = '';

        if (this.draggedService !== targetServiceId) {
            try {
                const draggedService = Database.getById('services', this.draggedService);
                const targetService = Database.getById('services', targetServiceId);

                if (draggedService && targetService && draggedService.categoryId === targetService.categoryId) {
                    const draggedOrder = draggedService.sortOrder || 0;
                    const targetOrder = targetService.sortOrder || 0;

                    Database.update('services', this.draggedService, { sortOrder: targetOrder });
                    Database.update('services', targetServiceId, { sortOrder: draggedOrder });

                    Toast.success('Порядок услуг изменен');
                    App.refresh();
                }
            } catch (error) {
                console.error('Error reordering services:', error);
                Toast.error('Ошибка при изменении порядка');
            }
        }

        return false;
    },

    /**
     * Show inline price edit
     */
    showInlinePriceEdit(serviceId, currentPrice) {
        const newPrice = prompt('Введите новую цену:', currentPrice);
        if (newPrice && !isNaN(newPrice) && parseInt(newPrice) > 0) {
            try {
                const result = Database.updateServicePrice(serviceId, parseInt(newPrice), 'Ручное изменение');
                if (result) {
                    Toast.success('Цена изменена: ' + result.oldPrice + ' → ' + result.newPrice + ' ₽');
                    App.refresh();
                }
            } catch (error) {
                console.error('Error updating price:', error);
                Toast.error('Ошибка при изменении цены');
            }
        }
    },

    /**
     * Show price history modal
     */
    showPriceHistory(serviceId) {
        const service = Database.getById('services', serviceId);
        const history = Database.getPriceHistory(serviceId);

        let content = '<h3 class="font-bold text-lg mb-4">' + service.name + '</h3>';

        if (history.length === 0) {
            content += '<p class="text-center text-gray-500 py-8">История изменений отсутствует</p>';
        } else {
            content += '<div class="space-y-3">';
            history.forEach(function(record) {
                const date = new Date(record.changeDate);
                const dateStr = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const diff = record.newPrice - record.oldPrice;
                const diffClass = diff > 0 ? 'text-green-600' : 'text-red-600';
                const diffIcon = diff > 0 ? 'fa-arrow-up' : 'fa-arrow-down';

                content += '<div class="border border-gray-200 rounded-lg p-4">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<span class="text-sm text-gray-600">' + dateStr + '</span>' +
                        '<span class="' + diffClass + ' font-semibold">' +
                            '<i class="fas ' + diffIcon + ' mr-1"></i>' +
                            (diff > 0 ? '+' : '') + diff + ' ₽' +
                        '</span>' +
                    '</div>' +
                    '<div class="flex items-center space-x-2 text-sm">' +
                        '<span class="text-gray-600">Было:</span>' +
                        '<span class="font-semibold">' + record.oldPrice + ' ₽</span>' +
                        '<i class="fas fa-arrow-right text-gray-400"></i>' +
                        '<span class="text-gray-600">Стало:</span>' +
                        '<span class="font-semibold">' + record.newPrice + ' ₽</span>' +
                    '</div>' +
                    (record.reason ?
                        '<p class="text-sm text-gray-600 mt-2">' +
                            '<i class="fas fa-info-circle mr-1"></i>' + record.reason +
                        '</p>'
                        : ''
                    ) +
                '</div>';
            });
            content += '</div>';
        }

        document.getElementById('price-history-content').innerHTML = content;
        document.getElementById('price-history-modal').classList.remove('hidden');
    },

    closePriceHistoryModal() {
        document.getElementById('price-history-modal').classList.add('hidden');
    },

    /**
     * Toggle service active status
     */
    toggleServiceActive(serviceId, isActive) {
        try {
            Database.update('services', serviceId, { isActive: isActive });
            Toast.success(isActive ? 'Услуга активирована' : 'Услуга деактивирована');
            App.refresh();
        } catch (error) {
            console.error('Error toggling service active:', error);
            Toast.error('Ошибка при изменении статуса');
        }
    },

    /**
     * Copy service as template
     */
    copyService(serviceId) {
        try {
            const service = Database.getById('services', serviceId);
            if (!service) return;

            const newService = {
                name: service.name + ' (копия)',
                categoryId: service.categoryId,
                price: service.price,
                duration: service.duration,
                description: service.description,
                requiredMaterials: service.requiredMaterials || [],
                isActive: false,
                sortOrder: (service.sortOrder || 0) + 1
            };

            Database.create('services', newService);
            Toast.success('Услуга скопирована');
            App.refresh();
        } catch (error) {
            console.error('Error copying service:', error);
            Toast.error('Ошибка при копировании услуги');
        }
    },

    /**
     * Show add service modal
     */
    showAddServiceModal() {
        document.getElementById('service-modal-title').textContent = 'Новая услуга';
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-active').checked = true;
        document.getElementById('service-modal').classList.remove('hidden');
    },

    /**
     * Edit service
     */
    editService(id) {
        const service = Database.getById('services', id);
        if (!service) return;

        document.getElementById('service-modal-title').textContent = 'Редактировать услугу';
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-category').value = service.categoryId;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-duration').value = service.duration;
        document.getElementById('service-description').value = service.description || '';
        document.getElementById('service-active').checked = service.isActive !== false;

        // Set selected materials
        const materialsSelect = document.getElementById('service-materials');
        const selectedMaterials = service.requiredMaterials || [];
        for (let i = 0; i < materialsSelect.options.length; i++) {
            materialsSelect.options[i].selected = selectedMaterials.indexOf(parseInt(materialsSelect.options[i].value)) !== -1;
        }

        document.getElementById('service-modal').classList.remove('hidden');
    },

    /**
     * Save service
     */
    saveService() {
        try {
            const id = document.getElementById('service-id').value;
            const materialsSelect = document.getElementById('service-materials');
            const selectedMaterials = Array.from(materialsSelect.selectedOptions).map(function(opt) {
                return parseInt(opt.value);
            });

            const data = {
                name: document.getElementById('service-name').value,
                categoryId: parseInt(document.getElementById('service-category').value),
                price: parseInt(document.getElementById('service-price').value),
                duration: parseInt(document.getElementById('service-duration').value),
                description: document.getElementById('service-description').value || '',
                requiredMaterials: selectedMaterials,
                isActive: document.getElementById('service-active').checked
            };

            if (id) {
                const oldService = Database.getById('services', parseInt(id));
                Database.update('services', parseInt(id), data);

                // Track price change
                if (oldService.price !== data.price) {
                    Database.updateServicePrice(parseInt(id), data.price, 'Редактирование услуги');
                }

                Toast.success('Услуга обновлена');
            } else {
                data.sortOrder = 999;
                Database.create('services', data);
                Toast.success('Услуга создана');
            }

            this.closeServiceModal();
            App.refresh();
        } catch (error) {
            console.error('Error saving service:', error);
            Toast.error('Ошибка при сохранении услуги');
        }
    },

    /**
     * Delete service
     */
    deleteService(id) {
        if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
            try {
                Database.delete('services', id);
                Toast.success('Услуга удалена');
                App.refresh();
            } catch (error) {
                console.error('Error deleting service:', error);
                Toast.error('Ошибка при удалении услуги');
            }
        }
    },

    /**
     * Close service modal
     */
    closeServiceModal() {
        document.getElementById('service-modal').classList.add('hidden');
    },

    /**
     * Show bulk price change modal
     */
    showBulkPriceChangeModal() {
        document.getElementById('bulk-price-modal').classList.remove('hidden');
    },

    closeBulkPriceModal() {
        document.getElementById('bulk-price-modal').classList.add('hidden');
    },

    /**
     * Apply bulk price change
     */
    applyBulkPriceChange() {
        const percentage = parseFloat(document.getElementById('bulk-percentage').value);
        const categoryId = document.getElementById('bulk-category').value;

        if (isNaN(percentage)) {
            Toast.error('Введите корректный процент');
            return;
        }

        if (confirm('Изменить цены на ' + percentage + '%?')) {
            try {
                const changes = Database.bulkUpdatePrices(percentage, categoryId ? parseInt(categoryId) : null);
                Toast.success('Изменено цен: ' + changes.length);
                this.closeBulkPriceModal();
                App.refresh();
            } catch (error) {
                console.error('Error bulk updating prices:', error);
                Toast.error('Ошибка при массовом изменении цен');
            }
        }
    },

    /**
     * Toggle service for calculator
     */
    toggleServiceForCalculator(serviceId) {
        if (this.selectedServicesForCalculator.has(serviceId)) {
            this.selectedServicesForCalculator.delete(serviceId);
        } else {
            this.selectedServicesForCalculator.add(serviceId);
        }

        const btn = document.getElementById('calc-btn-' + serviceId);
        if (btn) {
            if (this.selectedServicesForCalculator.has(serviceId)) {
                btn.classList.add('bg-green-100');
            } else {
                btn.classList.remove('bg-green-100');
            }
        }
    },

    /**
     * Show calculator
     */
    showCalculator() {
        const serviceIds = Array.from(this.selectedServicesForCalculator);

        if (serviceIds.length === 0) {
            Toast.warning('Выберите услуги, нажав кнопку калькулятора');
            return;
        }

        const bundle = Database.calculateServiceBundle(serviceIds, 0);

        let content = '<div class="space-y-4">' +
            '<div class="bg-gray-50 rounded-lg p-4">' +
                '<h3 class="font-bold text-lg mb-3">Выбранные услуги:</h3>' +
                '<div class="space-y-2">';

        bundle.services.forEach(function(service) {
            content += '<div class="flex items-center justify-between p-2 bg-white rounded border border-gray-200">' +
                '<span>' + service.name + '</span>' +
                '<div class="flex items-center space-x-4 text-sm">' +
                    '<span class="text-gray-600">' +
                        '<i class="fas fa-clock mr-1"></i>' + service.duration + ' мин' +
                    '</span>' +
                    '<span class="font-semibold">' + service.price + ' ₽</span>' +
                '</div>' +
            '</div>';
        });

        content += '</div></div>' +

            '<div class="bg-blue-50 rounded-lg p-4">' +
                '<div class="space-y-2">' +
                    '<div class="flex items-center justify-between text-gray-700">' +
                        '<span>Общая длительность:</span>' +
                        '<span class="font-semibold">' + bundle.totalHours + ' ч ' + bundle.totalMinutes + ' мин</span>' +
                    '</div>' +
                    '<div class="flex items-center justify-between text-gray-700">' +
                        '<span>Количество услуг:</span>' +
                        '<span class="font-semibold">' + bundle.services.length + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div>' +
                '<label class="block text-sm font-medium text-gray-700 mb-2">Скидка:</label>' +
                '<div class="flex space-x-2">' +
                    '<input type="number" id="calculator-discount" value="0" min="0" max="100" step="5" ' +
                        'oninput="Services.updateCalculatorTotal()" ' +
                        'class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">' +
                    '<span class="flex items-center px-4 py-2 bg-gray-100 rounded-lg">%</span>' +
                '</div>' +
            '</div>' +

            '<div id="calculator-total" class="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">' +
                '<div class="flex items-center justify-between">' +
                    '<div>' +
                        '<p class="text-sm opacity-90">Итого к оплате:</p>' +
                        '<p class="text-4xl font-bold mt-1" id="calculator-final-price">' + bundle.totalPrice + ' ₽</p>' +
                    '</div>' +
                    '<i class="fas fa-ruble-sign text-6xl opacity-30"></i>' +
                '</div>' +
            '</div>' +

            '<div class="flex space-x-4">' +
                '<button onclick="Services.clearCalculator()" class="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">' +
                    '<i class="fas fa-trash mr-2"></i>Очистить' +
                '</button>' +
                '<button onclick="Services.closeCalculator()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">' +
                    'Закрыть' +
                '</button>' +
            '</div>' +
        '</div>';

        document.getElementById('calculator-content').innerHTML = content;
        document.getElementById('calculator-modal').classList.remove('hidden');
    },

    /**
     * Update calculator total
     */
    updateCalculatorTotal() {
        const discount = parseFloat(document.getElementById('calculator-discount').value) || 0;
        const serviceIds = Array.from(this.selectedServicesForCalculator);
        const bundle = Database.calculateServiceBundle(serviceIds, discount);

        document.getElementById('calculator-final-price').textContent = bundle.finalPrice + ' ₽';
    },

    /**
     * Clear calculator
     */
    clearCalculator() {
        this.selectedServicesForCalculator.clear();
        this.closeCalculator();
        App.refresh();
    },

    closeCalculator() {
        document.getElementById('calculator-modal').classList.add('hidden');
    },

    /**
     * Generate extended services
     */
    generateExtendedServices() {
        if (confirm('Это заменит текущий список услуг на расширенный (39 услуг). Продолжить?')) {
            try {
                Database.generateExtendedServices();
                Database.generateExtendedEmployees();
                Toast.success('Сгенерировано 39 услуг и 7 сотрудников');
                App.refresh();
            } catch (error) {
                console.error('Error generating services:', error);
                Toast.error('Ошибка при генерации данных');
            }
        }
    }
};
