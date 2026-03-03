/**
 * Inventory Management Component
 * Handles warehouse operations, stock tracking, and procurement
 */

class InventoryComponent {
    constructor() {
        this.currentFilter = {
            category: 'all',
            stockLevel: 'all',
            search: ''
        };
        this.selectedItems = [];
    }

    render() {
        const db = window.beautyDB.getDatabase();

        return `
            <div class="inventory-page">
                <!-- Header with Quick Stats -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">
                            <i class="fas fa-boxes mr-3"></i>Складской учет
                        </h1>
                        <p class="text-gray-600">Управление товарами и материалами</p>
                    </div>
                    <button onclick="inventoryComponent.showAddTransactionModal('receipt')"
                            class="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Приход товара
                    </button>
                </div>

                <!-- Alert Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    ${this.renderAlertCards()}
                </div>

                <!-- Main Content Tabs -->
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="border-b border-gray-200 overflow-x-auto">
                        <nav class="flex -mb-px">
                            <button class="tab-btn active" onclick="inventoryComponent.switchTab('stock')">
                                <i class="fas fa-warehouse mr-2"></i>Остатки на складе
                            </button>
                            <button class="tab-btn" onclick="inventoryComponent.switchTab('movements')">
                                <i class="fas fa-exchange-alt mr-2"></i>Движение товаров
                            </button>
                            <button class="tab-btn" onclick="inventoryComponent.switchTab('procurement')">
                                <i class="fas fa-shopping-cart mr-2"></i>Закупки
                            </button>
                            <button class="tab-btn" onclick="inventoryComponent.switchTab('analytics')">
                                <i class="fas fa-chart-line mr-2"></i>Аналитика
                            </button>
                            <button class="tab-btn" onclick="inventoryComponent.switchTab('settings')">
                                <i class="fas fa-cog mr-2"></i>Настройки
                            </button>
                        </nav>
                    </div>

                    <!-- Tab Contents -->
                    <div class="p-6">
                        <div id="tab-stock" class="tab-content active">
                            ${this.renderStockTab()}
                        </div>
                        <div id="tab-movements" class="tab-content">
                            ${this.renderMovementsTab()}
                        </div>
                        <div id="tab-procurement" class="tab-content">
                            ${this.renderProcurementTab()}
                        </div>
                        <div id="tab-analytics" class="tab-content">
                            ${this.renderAnalyticsTab()}
                        </div>
                        <div id="tab-settings" class="tab-content">
                            ${this.renderSettingsTab()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAlertCards() {
        const lowStockItems = window.beautyDB.getLowStockItems();
        const expiringItems = window.beautyDB.getExpiringItems();
        const criticalItems = lowStockItems.filter(item => item.stockLevel === 'critical');

        return `
            <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg alert-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-red-100 text-sm font-medium">Критические остатки</p>
                        <p class="text-4xl font-bold mt-2">${criticalItems.length}</p>
                        <p class="text-red-100 text-sm mt-1">Требуется срочная закупка</p>
                    </div>
                    <div class="text-5xl opacity-20">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6 rounded-lg shadow-lg alert-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-yellow-100 text-sm font-medium">Низкие остатки</p>
                        <p class="text-4xl font-bold mt-2">${lowStockItems.length}</p>
                        <p class="text-yellow-100 text-sm mt-1">Ниже минимального уровня</p>
                    </div>
                    <div class="text-5xl opacity-20">
                        <i class="fas fa-box-open"></i>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg alert-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm font-medium">Истекает срок</p>
                        <p class="text-4xl font-bold mt-2">${expiringItems.length}</p>
                        <p class="text-purple-100 text-sm mt-1">В течение 30 дней</p>
                    </div>
                    <div class="text-5xl opacity-20">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderStockTab() {
        const categories = window.beautyDB.getAll('inventoryCategories');
        const items = this.getFilteredItems();

        return `
            <!-- Filters -->
            <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                    <select id="filter-category" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            onchange="inventoryComponent.updateFilter('category', this.value)">
                        <option value="all">Все категории</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}">${cat.name}</option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Уровень запасов</label>
                    <select id="filter-stock-level" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                            onchange="inventoryComponent.updateFilter('stockLevel', this.value)">
                        <option value="all">Все уровни</option>
                        <option value="critical">Критические</option>
                        <option value="low">Низкие</option>
                        <option value="normal">Нормальные</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
                    <div class="relative">
                        <input type="text" id="filter-search"
                               class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                               placeholder="Название, артикул, штрих-код..."
                               oninput="inventoryComponent.updateFilter('search', this.value)">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Действия</label>
                    <button onclick="inventoryComponent.scanBarcode()"
                            class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all">
                        <i class="fas fa-barcode mr-2"></i>Сканировать
                    </button>
                </div>
            </div>

            <!-- Stock Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Артикул</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Категория</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Остаток</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Минимум</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Поставщик</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Срок годности</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${items.length > 0 ? items.map(item => this.renderStockRow(item)).join('') :
                '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">Товары не найдены</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Summary -->
            <div class="mt-4 text-sm text-gray-600">
                Показано товаров: ${items.length}
            </div>
        `;
    }

    renderStockRow(item) {
        const category = window.beautyDB.getById('inventoryCategories', item.categoryId);
        const supplier = window.beautyDB.getById('suppliers', item.supplierId);
        const stockLevel = this.getStockLevel(item);
        const stockLevelBadge = this.getStockLevelBadge(stockLevel);

        return `
            <tr class="hover:bg-gray-50 transition-colors stock-row" data-stock-level="${stockLevel}">
                <td class="px-4 py-3 text-sm font-mono text-gray-900">${item.sku}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.name}</td>
                <td class="px-4 py-3 text-sm text-gray-600">
                    <i class="fas ${category ? category.icon : 'fa-box'} mr-2" style="color: ${category ? category.color : '#666'}"></i>
                    ${category ? category.name : 'Unknown'}
                </td>
                <td class="px-4 py-3 text-sm">
                    <span class="font-bold ${stockLevel === 'critical' ? 'text-red-600' : stockLevel === 'low' ? 'text-yellow-600' : 'text-green-600'}">
                        ${item.currentStock}
                    </span>
                    <span class="text-gray-500"> ${item.unit}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${item.minStock} ${item.unit}</td>
                <td class="px-4 py-3 text-sm">${stockLevelBadge}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.purchasePrice} ₽</td>
                <td class="px-4 py-3 text-sm text-gray-600">${supplier ? supplier.name : 'Unknown'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">
                    ${item.expiryDate ? this.formatExpiryDate(item.expiryDate) : '<span class="text-gray-400">—</span>'}
                </td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex gap-2">
                        <button onclick="inventoryComponent.viewItemDetails(${item.id})"
                                class="text-blue-600 hover:text-blue-800" title="Подробнее">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button onclick="inventoryComponent.showQuickConsumption(${item.id})"
                                class="text-purple-600 hover:text-purple-800" title="Расход">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                        <button onclick="inventoryComponent.showBarcode(${item.id})"
                                class="text-gray-600 hover:text-gray-800" title="Штрих-код">
                            <i class="fas fa-barcode"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderMovementsTab() {
        const movements = window.beautyDB.getInventoryMovementHistory();
        const types = {
            receipt: { label: 'Приход', color: 'green', icon: 'fa-plus-circle' },
            consumption: { label: 'Расход', color: 'blue', icon: 'fa-minus-circle' },
            writeoff: { label: 'Списание', color: 'red', icon: 'fa-trash' },
            adjustment: { label: 'Корректировка', color: 'yellow', icon: 'fa-edit' }
        };

        return `
            <div class="mb-6 flex justify-between items-center">
                <div class="flex gap-4">
                    <button onclick="inventoryComponent.showAddTransactionModal('receipt')"
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus-circle mr-2"></i>Приход
                    </button>
                    <button onclick="inventoryComponent.showAddTransactionModal('consumption')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-minus-circle mr-2"></i>Расход
                    </button>
                    <button onclick="inventoryComponent.showAddTransactionModal('writeoff')"
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <i class="fas fa-trash mr-2"></i>Списание
                    </button>
                    <button onclick="inventoryComponent.showAddTransactionModal('adjustment')"
                            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                        <i class="fas fa-edit mr-2"></i>Корректировка
                    </button>
                </div>
                <button onclick="inventoryComponent.exportMovements()"
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                    <i class="fas fa-file-excel mr-2"></i>Экспорт
                </button>
            </div>

            <!-- Movements Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Количество</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Остаток после</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Примечание</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сотрудник</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${movements.slice(0, 50).map(movement => {
            const typeInfo = types[movement.type] || { label: movement.type, color: 'gray', icon: 'fa-circle' };
            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm text-gray-900">
                                        ${new Date(movement.date).toLocaleString('ru-RU')}
                                    </td>
                                    <td class="px-4 py-3 text-sm">
                                        <span class="px-3 py-1 bg-${typeInfo.color}-100 text-${typeInfo.color}-800 rounded-full text-xs font-medium">
                                            <i class="fas ${typeInfo.icon} mr-1"></i>${typeInfo.label}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-900">${movement.itemName}</td>
                                    <td class="px-4 py-3 text-sm">
                                        <span class="${movement.type === 'receipt' ? 'text-green-600' : 'text-red-600'} font-medium">
                                            ${movement.type === 'receipt' ? '+' : '-'}${movement.quantity}
                                        </span>
                                        <span class="text-gray-500"> ${movement.unit}</span>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-900">${movement.stockAfter} ${movement.unit}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${movement.notes || '—'}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${movement.employeeName || 'Система'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="mt-4 text-sm text-gray-600">
                Показано последних записей: ${Math.min(50, movements.length)} из ${movements.length}
            </div>
        `;
    }

    renderProcurementTab() {
        const suppliers = window.beautyDB.getAll('suppliers');
        const purchaseOrders = window.beautyDB.getAll('purchaseOrders');
        const lowStockItems = window.beautyDB.getLowStockItems();

        return `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Auto-generate Purchase Orders -->
                <div class="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-4">
                        <i class="fas fa-magic mr-2"></i>Автоматическая закупка
                    </h3>
                    <p class="mb-4 text-purple-100">
                        Обнаружено ${lowStockItems.length} позиций с низкими остатками
                    </p>
                    <button onclick="inventoryComponent.generateAutoPurchaseOrders()"
                            class="px-6 py-3 bg-white text-purple-600 rounded-lg hover:shadow-lg font-medium transition-all">
                        <i class="fas fa-wand-magic mr-2"></i>Сформировать заказы
                    </button>
                </div>

                <!-- Suppliers Quick View -->
                <div class="bg-white border-2 border-gray-200 p-6 rounded-lg">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">
                        <i class="fas fa-truck mr-2"></i>Поставщики
                    </h3>
                    <div class="space-y-2">
                        ${suppliers.map(supplier => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div>
                                    <p class="font-medium text-gray-900">${supplier.name}</p>
                                    <p class="text-sm text-gray-600">${supplier.phone}</p>
                                </div>
                                <span class="text-sm text-gray-500">
                                    <i class="fas fa-shipping-fast mr-1"></i>${supplier.deliveryDays} дней
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="inventoryComponent.showAddSupplierModal()"
                            class="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-pink-500 hover:text-pink-500 transition-all">
                        <i class="fas fa-plus mr-2"></i>Добавить поставщика
                    </button>
                </div>
            </div>

            <!-- Purchase Orders Table -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="fas fa-clipboard-list mr-2"></i>Заказы поставщикам
                    </h3>
                    <button onclick="inventoryComponent.showCreatePurchaseOrderModal()"
                            class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                        <i class="fas fa-plus mr-2"></i>Новый заказ
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ заказа</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Поставщик</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Позиций</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${purchaseOrders.length > 0 ? purchaseOrders.map(order => {
            const supplier = window.beautyDB.getById('suppliers', order.supplierId);
            const statusInfo = this.getPurchaseOrderStatus(order.status);
            return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 text-sm font-mono text-gray-900">#${String(order.id).padStart(5, '0')}</td>
                                        <td class="px-4 py-3 text-sm text-gray-900">${new Date(order.date).toLocaleDateString('ru-RU')}</td>
                                        <td class="px-4 py-3 text-sm text-gray-900">${supplier ? supplier.name : 'Unknown'}</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${order.items.length}</td>
                                        <td class="px-4 py-3 text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)} ₽</td>
                                        <td class="px-4 py-3 text-sm">
                                            <span class="px-3 py-1 bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full text-xs font-medium">
                                                ${statusInfo.label}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-sm">
                                            <div class="flex gap-2">
                                                <button onclick="inventoryComponent.viewPurchaseOrder(${order.id})"
                                                        class="text-blue-600 hover:text-blue-800" title="Просмотр">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                ${order.status === 'pending' ? `
                                                    <button onclick="inventoryComponent.receivePurchaseOrder(${order.id})"
                                                            class="text-green-600 hover:text-green-800" title="Оприходовать">
                                                        <i class="fas fa-check-circle"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
        }).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Заказы отсутствуют</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderAnalyticsTab() {
        const abcAnalysis = window.beautyDB.getInventoryABCAnalysis();
        const turnoverData = window.beautyDB.getInventoryTurnoverRate();
        const expiringItems = window.beautyDB.getExpiringItems();

        return `
            <!-- ABC Analysis -->
            <div class="mb-8">
                <h3 class="text-xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-chart-pie mr-2"></i>ABC-анализ товаров
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
                        <p class="text-green-100 text-sm">Группа A (80% оборота)</p>
                        <p class="text-3xl font-bold mt-2">${abcAnalysis.summary.A.count}</p>
                        <p class="text-green-100 text-sm mt-1">${(abcAnalysis.summary.A.totalValue || 0).toFixed(0)} ₽</p>
                    </div>
                    <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
                        <p class="text-yellow-100 text-sm">Группа B (15% оборота)</p>
                        <p class="text-3xl font-bold mt-2">${abcAnalysis.summary.B.count}</p>
                        <p class="text-yellow-100 text-sm mt-1">${(abcAnalysis.summary.B.totalValue || 0).toFixed(0)} ₽</p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-6 rounded-lg">
                        <p class="text-gray-100 text-sm">Группа C (5% оборота)</p>
                        <p class="text-3xl font-bold mt-2">${abcAnalysis.summary.C.count}</p>
                        <p class="text-gray-100 text-sm mt-1">${(abcAnalysis.summary.C.totalValue || 0).toFixed(0)} ₽</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full bg-white rounded-lg shadow">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Артикул</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Расход</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Стоимость расхода</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% от оборота</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группа</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${abcAnalysis.items.slice(0, 20).map(item => {
            const categoryColors = {
                'A': 'green',
                'B': 'yellow',
                'C': 'gray'
            };
            const color = categoryColors[item.category];
            return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 text-sm font-mono text-gray-900">${item.sku}</td>
                                        <td class="px-4 py-3 text-sm text-gray-900">${item.itemName}</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${item.totalConsumption}</td>
                                        <td class="px-4 py-3 text-sm font-medium text-gray-900">${(item.totalValue || 0).toFixed(2)} ₽</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${(item.valuePercent || 0).toFixed(1)}%</td>
                                        <td class="px-4 py-3 text-sm">
                                            <span class="px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-xs font-bold">
                                                ${item.category}
                                            </span>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Turnover Rate -->
            <div class="mb-8">
                <h3 class="text-xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-sync-alt mr-2"></i>Оборачиваемость товаров
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full bg-white rounded-lg shadow">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Средний расход/день</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Запас в днях</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Коэффициент оборач.</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Рекомендация</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${turnoverData.slice(0, 20).map(item => {
            let recommendation = '';
            if (item.daysInStock < 7) {
                recommendation = '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>Срочно заказать</span>';
            } else if (item.daysInStock < 14) {
                recommendation = '<span class="text-yellow-600"><i class="fas fa-exclamation-circle mr-1"></i>Планировать закупку</span>';
            } else {
                recommendation = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Запас достаточен</span>';
            }
            return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 text-sm text-gray-900">${item.itemName}</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${(item.avgDailyConsumption || 0).toFixed(2)}</td>
                                        <td class="px-4 py-3 text-sm font-medium text-gray-900">${(item.daysInStock || 0).toFixed(1)}</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${(item.turnoverRate || 0).toFixed(2)}</td>
                                        <td class="px-4 py-3 text-sm">${recommendation}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Expiring Items -->
            <div>
                <h3 class="text-xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-calendar-times mr-2"></i>Товары с истекающим сроком годности
                </h3>
                ${expiringItems.length > 0 ? `
                    <div class="overflow-x-auto">
                        <table class="w-full bg-white rounded-lg shadow">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Остаток</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Срок годности</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Осталось дней</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${expiringItems.map(item => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 text-sm text-gray-900">${item.name}</td>
                                        <td class="px-4 py-3 text-sm text-gray-600">${item.currentStock} ${item.unit}</td>
                                        <td class="px-4 py-3 text-sm text-gray-900">${new Date(item.expiryDate).toLocaleDateString('ru-RU')}</td>
                                        <td class="px-4 py-3 text-sm font-medium ${item.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-yellow-600'}">
                                            ${item.daysUntilExpiry}
                                        </td>
                                        <td class="px-4 py-3 text-sm">
                                            <span class="px-3 py-1 ${item.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} rounded-full text-xs font-medium">
                                                ${item.urgency === 'critical' ? 'Критично' : 'Внимание'}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-sm">
                                            <button onclick="inventoryComponent.showAddTransactionModal('writeoff', ${item.id})"
                                                    class="text-red-600 hover:text-red-800">
                                                <i class="fas fa-trash mr-1"></i>Списать
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-gray-500 text-center py-8">Нет товаров с истекающим сроком годности</p>'}
            </div>
        `;
    }

    renderSettingsTab() {
        const serviceMaterials = window.beautyDB.getAll('serviceMaterials');
        const services = window.beautyDB.getAll('services');

        return `
            <div class="max-w-4xl">
                <h3 class="text-xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-link mr-2"></i>Привязка материалов к услугам
                </h3>

                <div class="mb-6">
                    <button onclick="inventoryComponent.showAddServiceMaterialModal()"
                            class="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Добавить привязку
                    </button>
                </div>

                <div class="space-y-4">
                    ${services.map(service => {
            const materials = serviceMaterials.filter(sm => sm.serviceId === service.id);
            const totalCost = window.beautyDB.calculateServiceMaterialCost(service.id);

            return `
                            <div class="bg-white border border-gray-200 rounded-lg p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-lg font-bold text-gray-900">${service.name}</h4>
                                        <p class="text-sm text-gray-600">Цена услуги: ${service.price} ₽ | Себестоимость материалов: ${totalCost.toFixed(2)} ₽</p>
                                        <p class="text-sm text-green-600 font-medium">Маржа: ${(service.price - totalCost).toFixed(2)} ₽ (${((service.price - totalCost) / service.price * 100).toFixed(1)}%)</p>
                                    </div>
                                    <button onclick="inventoryComponent.showAddServiceMaterialModal(${service.id})"
                                            class="text-pink-600 hover:text-pink-800">
                                        <i class="fas fa-plus-circle"></i>
                                    </button>
                                </div>

                                ${materials.length > 0 ? `
                                    <div class="space-y-2">
                                        ${materials.map(sm => {
                const item = window.beautyDB.getById('inventory', sm.itemId);
                if (!item) return '';
                const lineCost = item.purchasePrice * sm.quantity;
                return `
                                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <div class="flex-1">
                                                        <p class="font-medium text-gray-900">${item.name}</p>
                                                        <p class="text-sm text-gray-600">${sm.quantity} ${sm.unit} × ${item.purchasePrice} ₽ = ${lineCost.toFixed(2)} ₽</p>
                                                    </div>
                                                    <button onclick="inventoryComponent.removeServiceMaterial(${sm.id})"
                                                            class="text-red-600 hover:text-red-800">
                                                        <i class="fas fa-times-circle"></i>
                                                    </button>
                                                </div>
                                            `;
            }).join('')}
                                    </div>
                                ` : '<p class="text-gray-500 text-sm">Материалы не привязаны</p>'}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    // Helper Methods

    getFilteredItems() {
        let items = window.beautyDB.getAll('inventory');

        // Filter by category
        if (this.currentFilter.category !== 'all') {
            items = items.filter(item => item.categoryId === parseInt(this.currentFilter.category));
        }

        // Filter by stock level
        if (this.currentFilter.stockLevel !== 'all') {
            items = items.filter(item => {
                const level = this.getStockLevel(item);
                return level === this.currentFilter.stockLevel;
            });
        }

        // Filter by search
        if (this.currentFilter.search) {
            const search = this.currentFilter.search.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(search) ||
                item.sku.toLowerCase().includes(search) ||
                (item.barcode && item.barcode.includes(search))
            );
        }

        return items;
    }

    getStockLevel(item) {
        if (item.currentStock < (item.minStock * 0.5)) {
            return 'critical';
        } else if (item.currentStock <= item.minStock) {
            return 'low';
        } else {
            return 'normal';
        }
    }

    getStockLevelBadge(level) {
        const badges = {
            critical: '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"><i class="fas fa-exclamation-triangle mr-1"></i>Критично</span>',
            low: '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"><i class="fas fa-exclamation-circle mr-1"></i>Низкий</span>',
            normal: '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"><i class="fas fa-check-circle mr-1"></i>Норма</span>'
        };
        return badges[level] || badges.normal;
    }

    getPurchaseOrderStatus(status) {
        const statuses = {
            pending: { label: 'Ожидание', color: 'yellow' },
            ordered: { label: 'Заказано', color: 'blue' },
            received: { label: 'Получено', color: 'green' },
            cancelled: { label: 'Отменено', color: 'red' }
        };
        return statuses[status] || { label: status, color: 'gray' };
    }

    formatExpiryDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            return `<span class="text-red-600 font-medium">${date.toLocaleDateString('ru-RU')} (просрочен)</span>`;
        } else if (daysUntil <= 7) {
            return `<span class="text-red-600 font-medium">${date.toLocaleDateString('ru-RU')} (${daysUntil}д)</span>`;
        } else if (daysUntil <= 30) {
            return `<span class="text-yellow-600 font-medium">${date.toLocaleDateString('ru-RU')} (${daysUntil}д)</span>`;
        } else {
            return `<span class="text-gray-600">${date.toLocaleDateString('ru-RU')}</span>`;
        }
    }

    // UI Actions

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.inventory-page .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-btn').classList.add('active');

        // Update content
        document.querySelectorAll('.inventory-page .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    updateFilter(type, value) {
        this.currentFilter[type] = value;
        this.refreshStockTab();
    }

    refreshStockTab() {
        const stockTab = document.getElementById('tab-stock');
        if (stockTab) {
            stockTab.innerHTML = this.renderStockTab();
        }
    }

    scanBarcode() {
        const barcode = prompt('Введите штрих-код товара:');
        if (barcode) {
            this.currentFilter.search = barcode;
            document.getElementById('filter-search').value = barcode;
            this.refreshStockTab();
        }
    }

    showBarcode(itemId) {
        const item = window.beautyDB.getById('inventory', itemId);
        if (!item) return;

        showModal('Штрих-код товара', `
            <div class="text-center">
                <h3 class="text-xl font-bold mb-4">${item.name}</h3>
                <p class="text-gray-600 mb-4">Артикул: ${item.sku}</p>
                <div class="bg-white p-6 rounded-lg inline-block">
                    <svg id="barcode-${item.id}"></svg>
                </div>
                <p class="text-sm text-gray-600 mt-4 font-mono">${item.barcode}</p>
                <div class="mt-6 flex gap-4 justify-center">
                    <button onclick="inventoryComponent.printBarcode(${item.id})"
                            class="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                        <i class="fas fa-print mr-2"></i>Печать
                    </button>
                    <button onclick="closeModal()"
                            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Закрыть
                    </button>
                </div>
            </div>
        `);

        // Generate barcode using JsBarcode
        setTimeout(() => {
            if (typeof JsBarcode !== 'undefined') {
                JsBarcode(`#barcode-${item.id}`, item.barcode, {
                    format: 'EAN13',
                    width: 2,
                    height: 100,
                    displayValue: true
                });
            }
        }, 100);
    }

    printBarcode(itemId) {
        window.print();
    }

    viewItemDetails(itemId) {
        const item = window.beautyDB.getById('inventory', itemId);
        if (!item) return;

        const category = window.beautyDB.getById('inventoryCategories', item.categoryId);
        const supplier = window.beautyDB.getById('suppliers', item.supplierId);
        const movements = window.beautyDB.getInventoryMovementHistory(itemId);
        const stockLevel = this.getStockLevel(item);

        showModal('Карточка товара', `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Название</p>
                        <p class="font-bold text-lg">${item.name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Артикул</p>
                        <p class="font-bold text-lg font-mono">${item.sku}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Категория</p>
                        <p class="font-medium">${category ? category.name : 'Unknown'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Поставщик</p>
                        <p class="font-medium">${supplier ? supplier.name : 'Unknown'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Текущий остаток</p>
                        <p class="font-bold text-2xl ${stockLevel === 'critical' ? 'text-red-600' : stockLevel === 'low' ? 'text-yellow-600' : 'text-green-600'}">
                            ${item.currentStock} ${item.unit}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Минимальный остаток</p>
                        <p class="font-medium text-lg">${item.minStock} ${item.unit}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Цена закупки</p>
                        <p class="font-medium text-lg">${item.purchasePrice} ₽</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Срок годности</p>
                        <p class="font-medium">${item.expiryDate ? this.formatExpiryDate(item.expiryDate) : '—'}</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold mb-2">Последние движения</h4>
                    <div class="max-h-64 overflow-y-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-2 py-2 text-left">Дата</th>
                                    <th class="px-2 py-2 text-left">Тип</th>
                                    <th class="px-2 py-2 text-left">Количество</th>
                                    <th class="px-2 py-2 text-left">Остаток</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${movements.slice(0, 10).map(m => `
                                    <tr>
                                        <td class="px-2 py-2">${new Date(m.date).toLocaleDateString('ru-RU')}</td>
                                        <td class="px-2 py-2">${m.type}</td>
                                        <td class="px-2 py-2">${m.type === 'receipt' ? '+' : '-'}${m.quantity}</td>
                                        <td class="px-2 py-2">${m.stockAfter}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="flex gap-4">
                    <button onclick="inventoryComponent.showQuickConsumption(${itemId}); closeModal();"
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-minus mr-2"></i>Расход
                    </button>
                    <button onclick="inventoryComponent.showAddTransactionModal('receipt', ${itemId}); closeModal();"
                            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Приход
                    </button>
                    <button onclick="closeModal()"
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Закрыть
                    </button>
                </div>
            </div>
        `);
    }

    showQuickConsumption(itemId) {
        const item = window.beautyDB.getById('inventory', itemId);
        if (!item) return;

        showModal('Быстрый расход', `
            <form onsubmit="event.preventDefault(); inventoryComponent.processQuickConsumption(${itemId});">
                <div class="space-y-4">
                    <div>
                        <p class="text-sm text-gray-600">Товар</p>
                        <p class="font-bold text-lg">${item.name}</p>
                        <p class="text-sm text-gray-600">Остаток: ${item.currentStock} ${item.unit}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Количество расхода</label>
                        <input type="number" id="quick-consumption-qty" step="0.01" min="0.01" max="${item.currentStock}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Примечание</label>
                        <input type="text" id="quick-consumption-notes"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                               placeholder="Причина расхода...">
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-check mr-2"></i>Списать
                        </button>
                        <button type="button" onclick="closeModal()"
                                class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            Отмена
                        </button>
                    </div>
                </div>
            </form>
        `);
    }

    processQuickConsumption(itemId) {
        const qty = parseFloat(document.getElementById('quick-consumption-qty').value);
        const notes = document.getElementById('quick-consumption-notes').value;

        const transaction = window.beautyDB.addInventoryTransaction(
            itemId,
            'consumption',
            qty,
            notes || 'Быстрый расход',
            1
        );

        if (transaction) {
            closeModal();
            showNotification('success', 'Расход успешно оформлен');
            this.refreshStockTab();
        } else {
            showNotification('error', 'Ошибка при оформлении расхода');
        }
    }

    showAddTransactionModal(type, itemId = null) {
        const items = window.beautyDB.getAll('inventory');
        const typeLabels = {
            receipt: 'Приход товара',
            consumption: 'Расход товара',
            writeoff: 'Списание товара',
            adjustment: 'Корректировка остатков'
        };

        showModal(typeLabels[type], `
            <form onsubmit="event.preventDefault(); inventoryComponent.processTransaction('${type}');">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Товар</label>
                        <select id="transaction-item" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required ${itemId ? 'disabled' : ''}>
                            ${items.map(item => `
                                <option value="${item.id}" ${itemId === item.id ? 'selected' : ''}>
                                    ${item.name} (${item.sku}) - ${item.currentStock} ${item.unit}
                                </option>
                            `).join('')}
                        </select>
                        ${itemId ? `<input type="hidden" id="transaction-item-hidden" value="${itemId}">` : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Количество</label>
                        <input type="number" id="transaction-qty" step="0.01" min="0.01"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Примечание</label>
                        <textarea id="transaction-notes" rows="3"
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                  placeholder="Дополнительная информация..."></textarea>
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" class="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                            <i class="fas fa-check mr-2"></i>Сохранить
                        </button>
                        <button type="button" onclick="closeModal()"
                                class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            Отмена
                        </button>
                    </div>
                </div>
            </form>
        `);
    }

    processTransaction(type) {
        const itemIdInput = document.getElementById('transaction-item-hidden');
        const itemId = itemIdInput ? parseInt(itemIdInput.value) : parseInt(document.getElementById('transaction-item').value);
        const qty = parseFloat(document.getElementById('transaction-qty').value);
        const notes = document.getElementById('transaction-notes').value;

        const transaction = window.beautyDB.addInventoryTransaction(
            itemId,
            type,
            qty,
            notes || `${type} товара`,
            1
        );

        if (transaction) {
            closeModal();
            showNotification('success', 'Операция выполнена успешно');
            this.refreshStockTab();
            switchPage('inventory');
        } else {
            showNotification('error', 'Ошибка при выполнении операции');
        }
    }

    generateAutoPurchaseOrders() {
        const orders = window.beautyDB.generatePurchaseOrder();

        if (orders && orders.length > 0) {
            showNotification('success', `Создано заказов поставщикам: ${orders.length}`);
            switchPage('inventory');
        } else {
            showNotification('info', 'Нет товаров для заказа');
        }
    }

    viewPurchaseOrder(orderId) {
        const order = window.beautyDB.getById('purchaseOrders', orderId);
        if (!order) return;

        const supplier = window.beautyDB.getById('suppliers', order.supplierId);
        const statusInfo = this.getPurchaseOrderStatus(order.status);

        showModal(`Заказ поставщику #${String(order.id).padStart(5, '0')}`, `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Поставщик</p>
                        <p class="font-bold">${supplier ? supplier.name : 'Unknown'}</p>
                        <p class="text-sm text-gray-600">${supplier ? supplier.phone : ''}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Дата заказа</p>
                        <p class="font-medium">${new Date(order.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Статус</p>
                        <span class="inline-block px-3 py-1 bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full text-sm font-medium">
                            ${statusInfo.label}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Сумма заказа</p>
                        <p class="font-bold text-xl text-pink-600">${order.totalAmount.toFixed(2)} ₽</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold mb-2">Позиции заказа</h4>
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-2 text-left">Товар</th>
                                <th class="px-2 py-2 text-left">Артикул</th>
                                <th class="px-2 py-2 text-right">Кол-во</th>
                                <th class="px-2 py-2 text-right">Цена</th>
                                <th class="px-2 py-2 text-right">Сумма</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${order.items.map(item => `
                                <tr>
                                    <td class="px-2 py-2">${item.itemName}</td>
                                    <td class="px-2 py-2 font-mono text-gray-600">${item.sku}</td>
                                    <td class="px-2 py-2 text-right font-medium">${item.orderQuantity}</td>
                                    <td class="px-2 py-2 text-right">${item.price} ₽</td>
                                    <td class="px-2 py-2 text-right font-bold">${item.totalPrice.toFixed(2)} ₽</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="bg-gray-50 font-bold">
                            <tr>
                                <td colspan="4" class="px-2 py-2 text-right">Итого:</td>
                                <td class="px-2 py-2 text-right text-pink-600">${order.totalAmount.toFixed(2)} ₽</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="flex gap-4">
                    ${order.status === 'pending' ? `
                        <button onclick="inventoryComponent.receivePurchaseOrder(${order.id}); closeModal();"
                                class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-check-circle mr-2"></i>Оприходовать
                        </button>
                    ` : ''}
                    <button onclick="closeModal()"
                            class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Закрыть
                    </button>
                </div>
            </div>
        `);
    }

    receivePurchaseOrder(orderId) {
        const db = window.beautyDB.getDatabase();
        const order = db.purchaseOrders.find(o => o.id === orderId);

        if (!order || order.status !== 'pending') {
            showNotification('error', 'Заказ не найден или уже обработан');
            return;
        }

        // Add receipt transactions for all items
        order.items.forEach(item => {
            window.beautyDB.addInventoryTransaction(
                item.itemId,
                'receipt',
                item.orderQuantity,
                `Приход по заказу #${String(orderId).padStart(5, '0')}`,
                1
            );
        });

        // Update order status
        order.status = 'received';
        window.beautyDB.saveDatabase(db);

        showNotification('success', 'Заказ успешно оприходован');
        switchPage('inventory');
    }

    exportMovements() {
        const movements = window.beautyDB.getInventoryMovementHistory();
        const csv = this.convertToCSV(movements);
        this.downloadCSV(csv, 'inventory-movements.csv');
        showNotification('success', 'Отчет экспортирован');
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        return [headers, ...rows].join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    showAddSupplierModal() {
        showModal('Добавить поставщика', `
            <form onsubmit="event.preventDefault(); inventoryComponent.addSupplier();">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Название</label>
                        <input type="text" id="supplier-name" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                        <input type="tel" id="supplier-phone" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="supplier-email" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Срок доставки (дней)</label>
                        <input type="number" id="supplier-delivery" min="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" class="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                            <i class="fas fa-save mr-2"></i>Сохранить
                        </button>
                        <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            Отмена
                        </button>
                    </div>
                </div>
            </form>
        `);
    }

    addSupplier() {
        const db = window.beautyDB.getDatabase();
        const supplier = {
            id: window.beautyDB.getNextId('suppliers'),
            name: document.getElementById('supplier-name').value,
            phone: document.getElementById('supplier-phone').value,
            email: document.getElementById('supplier-email').value,
            deliveryDays: parseInt(document.getElementById('supplier-delivery').value)
        };

        db.suppliers.push(supplier);
        window.beautyDB.saveDatabase(db);

        closeModal();
        showNotification('success', 'Поставщик добавлен');
        switchPage('inventory');
    }

    showAddServiceMaterialModal(serviceId = null) {
        const services = window.beautyDB.getAll('services');
        const items = window.beautyDB.getAll('inventory');

        showModal('Привязка материала к услуге', `
            <form onsubmit="event.preventDefault(); inventoryComponent.addServiceMaterial();">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Услуга</label>
                        <select id="service-material-service" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required ${serviceId ? 'disabled' : ''}>
                            ${services.map(s => `
                                <option value="${s.id}" ${serviceId === s.id ? 'selected' : ''}>${s.name}</option>
                            `).join('')}
                        </select>
                        ${serviceId ? `<input type="hidden" id="service-material-service-hidden" value="${serviceId}">` : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Материал</label>
                        <select id="service-material-item" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                            ${items.map(item => `
                                <option value="${item.id}">${item.name} (${item.sku}) - ${item.purchasePrice} ₽/${item.unit}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Расход на услугу</label>
                        <input type="number" id="service-material-qty" step="0.01" min="0.01"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" class="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                            <i class="fas fa-save mr-2"></i>Сохранить
                        </button>
                        <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            Отмена
                        </button>
                    </div>
                </div>
            </form>
        `);
    }

    addServiceMaterial() {
        const db = window.beautyDB.getDatabase();
        const serviceIdInput = document.getElementById('service-material-service-hidden');
        const serviceId = serviceIdInput ? parseInt(serviceIdInput.value) : parseInt(document.getElementById('service-material-service').value);
        const itemId = parseInt(document.getElementById('service-material-item').value);
        const qty = parseFloat(document.getElementById('service-material-qty').value);
        const item = db.inventory.find(i => i.id === itemId);

        const serviceMaterial = {
            id: window.beautyDB.getNextId('serviceMaterials'),
            serviceId,
            itemId,
            quantity: qty,
            unit: item.unit
        };

        db.serviceMaterials.push(serviceMaterial);
        window.beautyDB.saveDatabase(db);

        closeModal();
        showNotification('success', 'Материал привязан к услуге');
        switchPage('inventory');
    }

    removeServiceMaterial(smId) {
        if (!confirm('Удалить привязку материала?')) return;

        const db = window.beautyDB.getDatabase();
        db.serviceMaterials = db.serviceMaterials.filter(sm => sm.id !== smId);
        window.beautyDB.saveDatabase(db);

        showNotification('success', 'Привязка удалена');
        switchPage('inventory');
    }

    showCreatePurchaseOrderModal() {
        showNotification('info', 'Используйте автоматическое формирование заказов или кнопки "Приход товара"');
    }

    afterRender() {
        // Setup any event handlers if needed
    }
}

// Initialize component
const inventoryComponent = new InventoryComponent();
const Inventory = inventoryComponent;
