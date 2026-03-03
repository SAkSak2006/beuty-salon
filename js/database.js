/**
 * Database module - API-backed with local cache for synchronous access
 * All data is stored on the server (SQLite) and cached locally in memory.
 * Reads are synchronous (from cache), writes update both cache and server.
 */

const API_BASE = '/api';

const Database = {
    // In-memory cache
    _cache: {},
    _ready: false,

    // Collection name to API endpoint mapping
    _endpoints: {
        clients: 'clients',
        employees: 'employees',
        services: 'services',
        serviceCategories: 'service-categories',
        appointments: 'appointments',
        payments: 'payments',
        inventory: 'inventory',
        inventoryCategories: 'inventory-categories',
        suppliers: 'suppliers',
        inventoryTransactions: 'inventory-transactions',
        serviceMaterials: 'service-materials',
        purchaseOrders: 'purchase-orders',
        schedule: 'schedule',
        priceHistory: 'price-history',
        competencyMatrix: 'competency-matrix',
        vacations: 'vacations'
    },

    // Initialize database structure
    structure: {
        clients: [],
        employees: [],
        services: [],
        serviceCategories: [],
        appointments: [],
        payments: [],
        inventory: [],
        inventoryCategories: [],
        suppliers: [],
        inventoryTransactions: [],
        serviceMaterials: [],
        purchaseOrders: [],
        schedule: [],
        priceHistory: [],
        competencyMatrix: [],
        vacations: []
    },

    /**
     * Initialize: load all data from the API into cache
     */
    async initDatabase() {
        try {
            const collections = Object.keys(this._endpoints);
            const results = await Promise.all(
                collections.map(col =>
                    fetch(`${API_BASE}/${this._endpoints[col]}`)
                        .then(r => r.ok ? r.json() : [])
                        .catch(() => [])
                )
            );
            collections.forEach((col, i) => {
                this._cache[col] = results[i];
            });
            this._ready = true;
            console.log('Database loaded from server');
        } catch (err) {
            console.error('Failed to load database from server:', err);
            // Initialize with empty cache
            Object.keys(this.structure).forEach(key => {
                this._cache[key] = [];
            });
            this._ready = true;
        }
    },

    /**
     * Sync helper: fetch to API (fire-and-forget for writes)
     */
    _apiCall(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        return fetch(`${API_BASE}/${endpoint}`, options)
            .then(r => r.ok ? r.json() : null)
            .catch(err => { console.error('API error:', err); return null; });
    },

    /**
     * Get entire database (returns cache)
     */
    getDatabase() {
        const db = {};
        Object.keys(this.structure).forEach(key => {
            db[key] = this._cache[key] || [];
        });
        return db;
    },

    /**
     * Save entire database (sends each changed collection to API)
     */
    saveDatabase(data) {
        // Update cache
        Object.keys(data).forEach(key => {
            if (this._cache[key] !== undefined) {
                this._cache[key] = data[key];
            }
        });
        // Note: individual operations sync via create/update/delete
        // This method is kept for backward compatibility with inventory.js etc.
    },

    /**
     * Refresh cache from server
     */
    async refreshCache(collection = null) {
        if (collection) {
            const endpoint = this._endpoints[collection];
            if (endpoint) {
                const data = await this._apiCall(endpoint);
                if (data) this._cache[collection] = data;
            }
        } else {
            await this.initDatabase();
        }
    },

    /**
     * Seed database — no-op (data is managed via the UI now)
     */
    seedDatabase() {
        console.log('Seed database is disabled — add data through the interface');
        return this.getDatabase();
    },

    /**
     * Reset database
     */
    resetDatabase() {
        Object.keys(this.structure).forEach(key => {
            this._cache[key] = [];
        });
        console.log('Local cache reset');
    },

    // ==================== GENERIC CRUD ====================

    getAll(collection) {
        return this._cache[collection] || [];
    },

    getById(collection, id) {
        const records = this.getAll(collection);
        return records.find(record => record.id === id);
    },

    create(collection, data) {
        const records = this._cache[collection] || [];
        // Generate temporary ID for immediate local use
        const tempId = records.length > 0
            ? Math.max(...records.map(r => r.id)) + 1
            : 1;
        const newRecord = { id: tempId, ...data };
        records.push(newRecord);
        this._cache[collection] = records;

        // Sync to server and update with real ID
        const endpoint = this._endpoints[collection];
        if (endpoint) {
            this._apiCall(endpoint, 'POST', data).then(serverRecord => {
                if (serverRecord && serverRecord.id !== tempId) {
                    const idx = records.findIndex(r => r.id === tempId);
                    if (idx !== -1) {
                        records[idx] = serverRecord;
                    }
                }
            });
        }

        return newRecord;
    },

    update(collection, id, data) {
        const records = this._cache[collection] || [];
        const index = records.findIndex(record => record.id === id);

        if (index !== -1) {
            records[index] = { ...records[index], ...data, id };
            this._cache[collection] = records;

            // Sync to server
            const endpoint = this._endpoints[collection];
            if (endpoint) {
                this._apiCall(`${endpoint}/${id}`, 'PUT', { ...records[index] });
            }

            return records[index];
        }
        return null;
    },

    delete(collection, id) {
        const records = this._cache[collection] || [];
        const filtered = records.filter(record => record.id !== id);

        if (filtered.length < records.length) {
            this._cache[collection] = filtered;

            // Sync to server
            const endpoint = this._endpoints[collection];
            if (endpoint) {
                this._apiCall(`${endpoint}/${id}`, 'DELETE');
            }

            return true;
        }
        return false;
    },

    // ==================== QUERY METHODS ====================

    getAppointmentsByDateRange(startDate, endDate) {
        const appointments = this.getAll('appointments');
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= new Date(startDate) && aptDate <= new Date(endDate);
        });
    },

    getAppointmentsByClient(clientId) {
        return this.getAll('appointments').filter(apt => apt.clientId === clientId);
    },

    getAppointmentsByEmployee(employeeId) {
        return this.getAll('appointments').filter(apt => apt.employeeId === employeeId);
    },

    getLowStockItems() {
        const inventory = this.getAll('inventory');
        return inventory.filter(item => {
            const stock = item.currentStock !== undefined ? item.currentStock : item.quantity;
            const min = item.minStock !== undefined ? item.minStock : item.minQuantity;
            return stock <= min;
        }).map(item => {
            const category = this.getById('inventoryCategories', item.categoryId);
            const supplier = this.getById('suppliers', item.supplierId);
            const stock = item.currentStock !== undefined ? item.currentStock : item.quantity;
            const min = item.minStock !== undefined ? item.minStock : item.minQuantity;
            return {
                ...item,
                categoryName: category ? category.name : (item.category || 'Unknown'),
                supplierName: supplier ? supplier.name : (item.supplier || 'Unknown'),
                stockLevel: stock < (min * 0.5) ? 'critical' : 'low'
            };
        });
    },

    getPaymentsByDateRange(startDate, endDate) {
        const payments = this.getAll('payments');
        return payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
        });
    },

    getClientStats(clientId) {
        const client = this.getById('clients', clientId);
        const appointments = this.getAppointmentsByClient(clientId);
        const completedAppointments = appointments.filter(apt => apt.status === 'completed');

        return {
            client,
            totalAppointments: appointments.length,
            completedAppointments: completedAppointments.length,
            upcomingAppointments: appointments.filter(apt =>
                apt.status === 'confirmed' && new Date(apt.date) > new Date()
            ).length
        };
    },

    getEmployeeStats(employeeId) {
        const employee = this.getById('employees', employeeId);
        const appointments = this.getAppointmentsByEmployee(employeeId);
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => apt.date === today);

        return {
            employee,
            totalAppointments: appointments.length,
            todayAppointments: todayAppointments.length
        };
    },

    // ==================== AVAILABILITY ====================

    checkEmployeeAvailability(employeeId, date, time, duration, excludeAppointmentId = null) {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        const schedule = this.getAll('schedule').find(s =>
            s.employeeId === employeeId && s.dayOfWeek === dayOfWeek
        );

        if (!schedule || !schedule.isWorkingDay) {
            return { available: false, reason: 'Мастер не работает в этот день' };
        }

        const [hours, minutes] = time.split(':').map(Number);
        const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
        const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

        const appointmentStart = hours * 60 + minutes;
        const appointmentEnd = appointmentStart + duration;
        const workStart = startHours * 60 + startMinutes;
        const workEnd = endHours * 60 + endMinutes;

        if (appointmentStart < workStart || appointmentEnd > workEnd) {
            return { available: false, reason: `Мастер работает с ${schedule.startTime} до ${schedule.endTime}` };
        }

        const appointments = this.getAll('appointments').filter(apt =>
            apt.employeeId === employeeId &&
            apt.date === date &&
            apt.status !== 'cancelled' &&
            apt.status !== 'no-show' &&
            apt.id !== excludeAppointmentId
        );

        for (const apt of appointments) {
            const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
            const aptStart = aptHours * 60 + aptMinutes;
            const aptEnd = aptStart + apt.duration;

            if ((appointmentStart >= aptStart && appointmentStart < aptEnd) ||
                (appointmentEnd > aptStart && appointmentEnd <= aptEnd) ||
                (appointmentStart <= aptStart && appointmentEnd >= aptEnd)) {
                return { available: false, reason: 'Это время уже занято', conflictingAppointment: apt };
            }
        }

        return { available: true, reason: 'Время доступно' };
    },

    getAvailableTimeSlots(employeeId, date, duration, count = 5) {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        const schedule = this.getAll('schedule').find(s =>
            s.employeeId === employeeId && s.dayOfWeek === dayOfWeek
        );

        if (!schedule || !schedule.isWorkingDay) return [];

        const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
        const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

        const slots = [];
        let currentTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;

        while (currentTime + duration <= endTime && slots.length < count) {
            const h = Math.floor(currentTime / 60);
            const m = currentTime % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            const availability = this.checkEmployeeAvailability(employeeId, date, timeStr, duration);
            if (availability.available) slots.push(timeStr);

            currentTime += 30;
        }

        return slots;
    },

    // ==================== PRICE MANAGEMENT ====================

    updateServicePrice(serviceId, newPrice, reason = '') {
        const service = this.getById('services', serviceId);
        if (!service) return null;

        const oldPrice = service.price;
        this.update('services', serviceId, { price: newPrice });

        this.create('priceHistory', {
            serviceId: serviceId,
            oldPrice: oldPrice,
            newPrice: newPrice,
            changeDate: new Date().toISOString(),
            reason: reason,
            changedBy: 'admin'
        });

        return { oldPrice, newPrice, service: service.name };
    },

    bulkUpdatePrices(percentage, categoryId = null) {
        let services = this.getAll('services');
        if (categoryId) services = services.filter(s => s.categoryId === categoryId);

        const changes = [];
        services.forEach(service => {
            const oldPrice = service.price;
            const newPrice = Math.round(oldPrice * (1 + percentage / 100));
            this.updateServicePrice(service.id, newPrice, `Массовое изменение цен на ${percentage}%`);
            changes.push({ id: service.id, name: service.name, oldPrice, newPrice });
        });

        return changes;
    },

    calculateServiceBundle(serviceIds, discount = 0) {
        const services = serviceIds.map(id => this.getById('services', id)).filter(s => s);
        const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
        const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
        const discountAmount = Math.round(totalPrice * discount / 100);
        const finalPrice = totalPrice - discountAmount;

        return {
            services: services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
            totalPrice, discount, discountAmount, finalPrice, totalDuration,
            totalHours: Math.floor(totalDuration / 60),
            totalMinutes: totalDuration % 60
        };
    },

    getPriceHistory(serviceId) {
        return this.getAll('priceHistory')
            .filter(h => h.serviceId === serviceId)
            .sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate));
    },

    // ==================== EMPLOYEE MANAGEMENT ====================

    getEmployeesByService(serviceId) {
        const competencies = (this.getAll('competencyMatrix') || []).filter(c => c.serviceId === serviceId && c.canPerform);
        return competencies.map(comp => {
            const employee = this.getById('employees', comp.employeeId);
            return { ...employee, customDuration: comp.customDuration, skillLevel: comp.skillLevel };
        }).filter(e => e && e.status === 'working');
    },

    getServiceDurationForEmployee(employeeId, serviceId) {
        const competency = (this.getAll('competencyMatrix') || []).find(c =>
            c.employeeId === employeeId && c.serviceId === serviceId
        );
        if (competency) return competency.customDuration;
        const service = this.getById('services', serviceId);
        return service ? service.duration : 60;
    },

    getEmployeeCompetencies(employeeId) {
        const competencies = (this.getAll('competencyMatrix') || []).filter(c => c.employeeId === employeeId);
        return competencies.map(comp => {
            const service = this.getById('services', comp.serviceId);
            return {
                ...comp,
                serviceName: service ? service.name : 'Unknown',
                servicePrice: service ? service.price : 0,
                defaultDuration: service ? service.duration : 0
            };
        });
    },

    addVacation(employeeId, startDate, endDate, type = 'vacation', reason = '') {
        return this.create('vacations', {
            employeeId, startDate, endDate, type, reason,
            createdAt: new Date().toISOString()
        });
    },

    isEmployeeOnVacation(employeeId, date) {
        const vacations = this.getAll('vacations').filter(v => v.employeeId === employeeId);
        return vacations.some(v => {
            const checkDate = new Date(date);
            return checkDate >= new Date(v.startDate) && checkDate <= new Date(v.endDate);
        });
    },

    applyScheduleTemplate(employeeId, template) {
        // Remove existing schedules for employee
        const existing = this.getAll('schedule').filter(s => s.employeeId === employeeId);
        existing.forEach(s => this.delete('schedule', s.id));

        const newSchedules = [];

        if (template === '5/2') {
            for (let day = 1; day <= 5; day++) {
                newSchedules.push(this.create('schedule', {
                    employeeId, dayOfWeek: day, startTime: '09:00', endTime: '18:00', isWorkingDay: true
                }));
            }
            newSchedules.push(this.create('schedule', { employeeId, dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorkingDay: false }));
            newSchedules.push(this.create('schedule', { employeeId, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false }));
        } else if (template === '2/2') {
            for (let day = 0; day <= 6; day++) {
                const isWorking = day % 4 < 2;
                newSchedules.push(this.create('schedule', {
                    employeeId, dayOfWeek: day,
                    startTime: isWorking ? '09:00' : '00:00',
                    endTime: isWorking ? '18:00' : '00:00',
                    isWorkingDay: isWorking
                }));
            }
        }

        return newSchedules;
    },

    calculateEmployeeSalary(employeeId, startDate, endDate) {
        const employee = this.getById('employees', employeeId);
        if (!employee) return null;

        const appointments = this.getAll('appointments').filter(apt =>
            apt.employeeId === employeeId &&
            apt.status === 'completed' &&
            apt.date >= startDate &&
            apt.date <= endDate
        );

        let totalRevenue = 0;
        appointments.forEach(apt => {
            const service = this.getById('services', apt.serviceId);
            if (service) totalRevenue += service.price;
        });

        const commissionAmount = Math.round(totalRevenue * employee.commission / 100);
        const totalSalary = employee.salary + commissionAmount;

        return {
            employee: employee.name, baseSalary: employee.salary,
            commission: employee.commission, appointmentsCount: appointments.length,
            totalRevenue, commissionAmount, totalSalary,
            period: { startDate, endDate }
        };
    },

    // ==================== ANALYTICS ====================

    getRevenueByPeriod(startDate, endDate, groupBy = 'day') {
        const payments = this.getPaymentsByDateRange(startDate, endDate);
        const groupedData = {};

        payments.forEach(payment => {
            if (payment.status === 'completed') {
                const date = new Date(payment.date);
                let key;
                if (groupBy === 'day') key = payment.date;
                else if (groupBy === 'week') {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay() + 1);
                    key = weekStart.toISOString().split('T')[0];
                } else if (groupBy === 'month') {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }

                if (!groupedData[key]) groupedData[key] = { date: key, revenue: 0, count: 0 };
                groupedData[key].revenue += payment.amount;
                groupedData[key].count += 1;
            }
        });

        return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
    },

    getClientMetrics(startDate, endDate) {
        const clients = this.getAll('clients');
        const appointments = this.getAppointmentsByDateRange(startDate, endDate);
        const allAppointments = this.getAll('appointments');

        const newClients = clients.filter(c => c.registrationDate >= startDate && c.registrationDate <= endDate);
        const activeClients = new Set(appointments.filter(a => a.status === 'completed').map(a => a.clientId));

        const repeatClients = Array.from(activeClients).filter(clientId => {
            return allAppointments.filter(a => a.clientId === clientId && a.status === 'completed').length > 1;
        });

        const totalRevenue = this.getPaymentsByDateRange(startDate, endDate)
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        const avgCheck = activeClients.size > 0 ? Math.round(totalRevenue / activeClients.size) : 0;
        const avgLTV = clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / clients.length) : 0;

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const churnedClients = clients.filter(c => {
            const lastVisit = c.lastVisit ? new Date(c.lastVisit) : null;
            return lastVisit && lastVisit < ninetyDaysAgo && (c.totalVisits || 0) > 0;
        });
        const activeTotal = clients.filter(c => (c.totalVisits || 0) > 0).length;
        const churnRate = activeTotal > 0 ? Math.round((churnedClients.length / activeTotal) * 100) : 0;

        return {
            totalClients: clients.length, newClients: newClients.length,
            activeClients: activeClients.size, repeatClients: repeatClients.length,
            repeatRate: activeClients.size > 0 ? Math.round((repeatClients.length / activeClients.size) * 100) : 0,
            avgCheck, avgLTV, churnRate, totalRevenue
        };
    },

    getRFMAnalysis() {
        const clients = this.getAll('clients');
        const appointments = this.getAll('appointments');
        const today = new Date();

        const clientRFM = clients.map(client => {
            const clientAppointments = appointments.filter(a => a.clientId === client.id && a.status === 'completed');
            if (clientAppointments.length === 0) return null;

            const lastVisit = client.lastVisit ? new Date(client.lastVisit) : null;
            const recency = lastVisit ? Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24)) : 999;

            return {
                clientId: client.id, clientName: client.name,
                recency, frequency: client.totalVisits || 0, monetary: client.totalSpent || 0
            };
        }).filter(c => c !== null);

        if (clientRFM.length === 0) return { clients: [], segments: {}, segmentCounts: [] };

        const recencyQuintiles = this.calculateQuintiles(clientRFM.map(c => c.recency), true);
        const frequencyQuintiles = this.calculateQuintiles(clientRFM.map(c => c.frequency), false);
        const monetaryQuintiles = this.calculateQuintiles(clientRFM.map(c => c.monetary), false);

        const segments = {};
        const rfmScored = clientRFM.map((client, index) => {
            const rScore = 6 - recencyQuintiles[index];
            const fScore = frequencyQuintiles[index];
            const mScore = monetaryQuintiles[index];
            const rfmScore = rScore + fScore + mScore;

            let segment;
            if (rScore >= 4 && fScore >= 4 && mScore >= 4) segment = 'VIP';
            else if (rScore >= 4 && fScore >= 3) segment = 'Лояльные';
            else if (rScore >= 4 && fScore <= 2) segment = 'Новички';
            else if (rScore <= 2 && fScore >= 3) segment = 'Требуют внимания';
            else if (rScore <= 2 && fScore <= 2) segment = 'Потерянные';
            else segment = 'Средние';

            if (!segments[segment]) segments[segment] = [];
            segments[segment].push({ ...client, rScore, fScore, mScore, rfmScore, segment });

            return { ...client, rScore, fScore, mScore, rfmScore, segment };
        });

        return {
            clients: rfmScored.sort((a, b) => b.rfmScore - a.rfmScore),
            segments,
            segmentCounts: Object.keys(segments).map(seg => ({
                segment: seg, count: segments[seg].length,
                avgMonetary: Math.round(segments[seg].reduce((sum, c) => sum + c.monetary, 0) / segments[seg].length)
            }))
        };
    },

    calculateQuintiles(values, ascending = false) {
        const sorted = [...values].sort((a, b) => ascending ? a - b : b - a);
        const quintileSize = Math.ceil(sorted.length / 5);
        return values.map(value => {
            const index = sorted.indexOf(value);
            return Math.min(5, Math.floor(index / quintileSize) + 1);
        });
    },

    getABCAnalysis() {
        const services = this.getAll('services');
        const appointments = this.getAll('appointments').filter(a => a.status === 'completed');

        const serviceRevenue = services.map(service => {
            const serviceAppointments = appointments.filter(a => a.serviceId === service.id);
            return {
                serviceId: service.id, serviceName: service.name, categoryId: service.categoryId,
                revenue: serviceAppointments.length * service.price, count: serviceAppointments.length
            };
        }).filter(s => s.revenue > 0);

        serviceRevenue.sort((a, b) => b.revenue - a.revenue);
        const totalRevenue = serviceRevenue.reduce((sum, s) => sum + s.revenue, 0);
        let cumulativeRevenue = 0;

        const classified = serviceRevenue.map(service => {
            cumulativeRevenue += service.revenue;
            const cumulativePercent = (cumulativeRevenue / totalRevenue) * 100;
            let category;
            if (cumulativePercent <= 80) category = 'A';
            else if (cumulativePercent <= 95) category = 'B';
            else category = 'C';

            return {
                ...service,
                revenuePercent: Math.round((service.revenue / totalRevenue) * 100 * 10) / 10,
                cumulativePercent: Math.round(cumulativePercent * 10) / 10,
                category
            };
        });

        const summary = {
            A: classified.filter(s => s.category === 'A'),
            B: classified.filter(s => s.category === 'B'),
            C: classified.filter(s => s.category === 'C')
        };

        return {
            services: classified,
            summary: {
                A: { count: summary.A.length, revenue: summary.A.reduce((sum, s) => sum + s.revenue, 0) },
                B: { count: summary.B.length, revenue: summary.B.reduce((sum, s) => sum + s.revenue, 0) },
                C: { count: summary.C.length, revenue: summary.C.reduce((sum, s) => sum + s.revenue, 0) }
            }
        };
    },

    getCohortAnalysis(months = 6) {
        const clients = this.getAll('clients');
        const appointments = this.getAll('appointments').filter(a => a.status === 'completed');
        const cohorts = {};
        const today = new Date();

        clients.forEach(client => {
            if (!client.registrationDate) return;
            const regDate = new Date(client.registrationDate);
            const cohortKey = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;

            if (!cohorts[cohortKey]) cohorts[cohortKey] = { cohort: cohortKey, totalClients: 0, retention: {} };
            cohorts[cohortKey].totalClients += 1;

            const clientAppointments = appointments.filter(a => a.clientId === client.id);
            for (let m = 0; m <= months; m++) {
                const monthDate = new Date(regDate);
                monthDate.setMonth(monthDate.getMonth() + m);
                if (monthDate > today) break;

                const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                const hasVisit = clientAppointments.some(apt => {
                    const aptDate = new Date(apt.date);
                    return `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
                });

                if (!cohorts[cohortKey].retention[m]) cohorts[cohortKey].retention[m] = 0;
                if (hasVisit) cohorts[cohortKey].retention[m] += 1;
            }
        });

        Object.keys(cohorts).forEach(key => {
            const cohort = cohorts[key];
            Object.keys(cohort.retention).forEach(month => {
                cohort.retention[month] = Math.round((cohort.retention[month] / cohort.totalClients) * 100);
            });
        });

        return Object.values(cohorts).sort((a, b) => b.cohort.localeCompare(a.cohort));
    },

    getServicePopularity(startDate, endDate) {
        const services = this.getAll('services');
        const appointments = this.getAppointmentsByDateRange(startDate, endDate).filter(a => a.status === 'completed');

        return services.map(service => {
            const serviceAppointments = appointments.filter(a => a.serviceId === service.id);
            return {
                serviceId: service.id, serviceName: service.name, categoryId: service.categoryId,
                count: serviceAppointments.length,
                revenue: serviceAppointments.length * service.price,
                avgPerDay: Math.round(serviceAppointments.length / Math.max(1, this.getDaysBetween(startDate, endDate)) * 10) / 10
            };
        }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    },

    getEmployeeEfficiency(startDate, endDate) {
        const employees = this.getAll('employees');
        const appointments = this.getAppointmentsByDateRange(startDate, endDate).filter(a => a.status === 'completed');
        const payments = this.getPaymentsByDateRange(startDate, endDate).filter(p => p.status === 'completed');

        return employees.map(employee => {
            const employeeAppointments = appointments.filter(a => a.employeeId === employee.id);
            const revenue = payments.filter(p => {
                const appointment = appointments.find(a => a.id === p.appointmentId);
                return appointment && appointment.employeeId === employee.id;
            }).reduce((sum, p) => sum + p.amount, 0);

            const totalMinutes = employeeAppointments.reduce((sum, a) => sum + a.duration, 0);
            const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

            return {
                employeeId: employee.id, employeeName: employee.name, position: employee.position,
                appointmentsCount: employeeAppointments.length, revenue, totalHours,
                revenuePerHour: totalHours > 0 ? Math.round(revenue / totalHours) : 0,
                avgCheck: employeeAppointments.length > 0 ? Math.round(revenue / employeeAppointments.length) : 0
            };
        }).filter(e => e.appointmentsCount > 0).sort((a, b) => b.revenue - a.revenue);
    },

    getRevenueForecasting(forecastDays = 30) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const dailyRevenue = this.getRevenueByPeriod(startDate, today, 'day');

        if (dailyRevenue.length < 7) {
            return { forecast: [], trend: 'insufficient-data', avgDailyRevenue: 0, historical: dailyRevenue, trendSlope: 0 };
        }

        const n = dailyRevenue.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        dailyRevenue.forEach((day, index) => {
            sumX += index; sumY += day.revenue; sumXY += index * day.revenue; sumX2 += index * index;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const forecast = [];
        const lastDate = new Date(dailyRevenue[dailyRevenue.length - 1].date);
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                forecastRevenue: Math.max(0, Math.round(slope * (n + i - 1) + intercept))
            });
        }

        return {
            historical: dailyRevenue, forecast,
            trend: slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable',
            avgDailyRevenue: Math.round(sumY / n),
            trendSlope: Math.round(slope * 100) / 100
        };
    },

    getDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    },

    getTopServices(limit = 5, startDate = null, endDate = null) {
        const appointments = startDate && endDate
            ? this.getAppointmentsByDateRange(startDate, endDate).filter(a => a.status === 'completed')
            : this.getAll('appointments').filter(a => a.status === 'completed');

        const serviceStats = {};
        appointments.forEach(apt => {
            const service = this.getById('services', apt.serviceId);
            if (service) {
                if (!serviceStats[service.id]) serviceStats[service.id] = { id: service.id, name: service.name, count: 0, revenue: 0 };
                serviceStats[service.id].count += 1;
                serviceStats[service.id].revenue += service.price;
            }
        });

        return Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    },

    getTodayEmployeeLoad() {
        const today = new Date().toISOString().split('T')[0];
        const employees = this.getAll('employees').filter(e => e.status === 'working');
        const appointments = this.getAll('appointments').filter(a =>
            a.date === today && (a.status === 'confirmed' || a.status === 'pending')
        );

        return employees.map(employee => {
            const employeeAppointments = appointments.filter(a => a.employeeId === employee.id);
            const totalMinutes = employeeAppointments.reduce((sum, a) => sum + a.duration, 0);
            return {
                employeeId: employee.id, employeeName: employee.name,
                appointmentsCount: employeeAppointments.length, totalMinutes,
                loadPercentage: Math.min(100, Math.round((totalMinutes / 540) * 100))
            };
        }).sort((a, b) => b.loadPercentage - a.loadPercentage);
    },

    getUpcomingAppointments(limit = 5) {
        const today = new Date();
        const appointments = this.getAll('appointments')
            .filter(a => {
                const aptDate = new Date(a.date + 'T' + a.time);
                return aptDate >= today && (a.status === 'confirmed' || a.status === 'pending');
            })
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
            .slice(0, limit);

        return appointments.map(apt => {
            const client = this.getById('clients', apt.clientId);
            const employee = this.getById('employees', apt.employeeId);
            const service = this.getById('services', apt.serviceId);
            return {
                ...apt,
                clientName: client ? client.name : 'Unknown',
                employeeName: employee ? employee.name : 'Unknown',
                serviceName: service ? service.name : 'Unknown',
                price: service ? service.price : 0
            };
        });
    },

    getBirthdaysThisWeek() {
        const today = new Date();
        const clients = this.getAll('clients');

        return clients.filter(client => {
            if (!client.birthdate) return false;
            const birthdate = new Date(client.birthdate);
            const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
            const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).map(client => {
            const birthdate = new Date(client.birthdate);
            const birthdayThisYear = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
            const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
            return { ...client, daysUntilBirthday: daysUntil, age: today.getFullYear() - birthdate.getFullYear() };
        }).sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    },

    // ==================== INVENTORY MANAGEMENT ====================

    getNextId(collection) {
        const records = this.getAll(collection);
        return records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    },

    addInventoryTransaction(itemId, type, quantity, reason, employeeId, supplierId = null, price = null) {
        const item = this.getById('inventory', itemId);
        if (!item) return null;

        const transaction = this.create('inventoryTransactions', {
            itemId, type, quantity, date: new Date().toISOString().split('T')[0],
            reason, employeeId, supplierId, price
        });

        // Update stock
        const currentStock = item.currentStock !== undefined ? item.currentStock : item.quantity || 0;
        if (type === 'receipt' || type === 'adjustment') {
            this.update('inventory', itemId, { currentStock: currentStock + quantity });
        } else if (type === 'consumption' || type === 'writeoff') {
            this.update('inventory', itemId, { currentStock: currentStock - quantity });
        }

        return transaction;
    },

    consumeServiceMaterials(serviceId, employeeId) {
        const serviceMaterials = this.getAll('serviceMaterials').filter(sm => sm.serviceId === serviceId);
        const transactions = [];
        serviceMaterials.forEach(sm => {
            const t = this.addInventoryTransaction(sm.itemId, 'consumption', sm.quantity,
                `Автоматическое списание для услуги ID ${serviceId}`, employeeId);
            if (t) transactions.push(t);
        });
        return transactions;
    },

    getExpiringItems() {
        const items = this.getAll('inventory');
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        return items.filter(item => {
            if (!item.expiryDate) return false;
            const expiryDate = new Date(item.expiryDate);
            return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        }).map(item => {
            const category = this.getById('inventoryCategories', item.categoryId);
            const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24));
            return {
                ...item,
                categoryName: category ? category.name : 'Unknown',
                daysUntilExpiry,
                urgency: daysUntilExpiry <= 7 ? 'critical' : 'warning'
            };
        }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    },

    calculateServiceMaterialCost(serviceId) {
        const serviceMaterials = this.getAll('serviceMaterials').filter(sm => sm.serviceId === serviceId);
        let totalCost = 0;
        serviceMaterials.forEach(sm => {
            const item = this.getById('inventory', sm.itemId);
            if (item) {
                const unitCost = item.purchasePrice / (item.unit === 'мл' || item.unit === 'гр' ? 100 : 1);
                totalCost += unitCost * sm.quantity;
            }
        });
        return Math.round(totalCost);
    },

    getInventoryMovementHistory(itemId = null, startDate = null, endDate = null) {
        let transactions = this.getAll('inventoryTransactions');
        if (itemId) transactions = transactions.filter(t => t.itemId === itemId);
        if (startDate) transactions = transactions.filter(t => t.date >= startDate);
        if (endDate) transactions = transactions.filter(t => t.date <= endDate);

        return transactions.map(t => {
            const item = this.getById('inventory', t.itemId);
            const employee = this.getById('employees', t.employeeId);
            const supplier = t.supplierId ? this.getById('suppliers', t.supplierId) : null;
            return {
                ...t,
                itemName: item ? item.name : 'Unknown',
                itemSku: item ? item.sku : 'Unknown',
                employeeName: employee ? employee.name : 'Unknown',
                supplierName: supplier ? supplier.name : null
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getInventoryABCAnalysis() {
        const items = this.getAll('inventory');
        const transactions = this.getAll('inventoryTransactions');

        const consumptionData = items.map(item => {
            const itemTransactions = transactions.filter(t => t.itemId === item.id && t.type === 'consumption');
            const totalConsumption = itemTransactions.reduce((sum, t) => sum + t.quantity, 0);
            const totalValue = totalConsumption * (item.purchasePrice || 0);
            return {
                itemId: item.id, itemName: item.name, sku: item.sku || '',
                totalConsumption, totalValue, currentStock: item.currentStock || 0
            };
        }).filter(item => item.totalValue > 0);

        consumptionData.sort((a, b) => b.totalValue - a.totalValue);
        const totalValue = consumptionData.reduce((sum, item) => sum + item.totalValue, 0);
        let cumulativeValue = 0;

        const classified = consumptionData.map(item => {
            cumulativeValue += item.totalValue;
            const cumulativePercent = (cumulativeValue / totalValue) * 100;
            let category;
            if (cumulativePercent <= 80) category = 'A';
            else if (cumulativePercent <= 95) category = 'B';
            else category = 'C';

            return {
                ...item,
                valuePercent: Math.round((item.totalValue / totalValue) * 1000) / 10,
                cumulativePercent: Math.round(cumulativePercent * 10) / 10,
                category
            };
        });

        return {
            items: classified,
            summary: {
                A: { count: classified.filter(i => i.category === 'A').length, totalValue: classified.filter(i => i.category === 'A').reduce((sum, i) => sum + i.totalValue, 0) },
                B: { count: classified.filter(i => i.category === 'B').length, totalValue: classified.filter(i => i.category === 'B').reduce((sum, i) => sum + i.totalValue, 0) },
                C: { count: classified.filter(i => i.category === 'C').length, totalValue: classified.filter(i => i.category === 'C').reduce((sum, i) => sum + i.totalValue, 0) }
            }
        };
    },

    getInventoryTurnoverRate(months = 3) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);
        const startDateStr = startDate.toISOString().split('T')[0];
        const items = this.getAll('inventory');
        const transactions = this.getAll('inventoryTransactions');

        return items.map(item => {
            const itemTransactions = transactions.filter(t =>
                t.itemId === item.id && t.type === 'consumption' && t.date >= startDateStr
            );
            const totalConsumption = itemTransactions.reduce((sum, t) => sum + t.quantity, 0);
            const currentStock = item.currentStock || 0;
            const avgStock = currentStock + (totalConsumption / 2);
            const turnoverRate = avgStock > 0 ? (totalConsumption / avgStock) : 0;
            const avgDailyConsumption = totalConsumption / (months * 30);
            const daysInStock = avgDailyConsumption > 0 ? Math.round(currentStock / avgDailyConsumption) : 999;

            return {
                itemId: item.id, itemName: item.name, sku: item.sku || '',
                currentStock, totalConsumption,
                avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
                turnoverRate: Math.round(turnoverRate * 100) / 100,
                daysInStock
            };
        }).sort((a, b) => b.turnoverRate - a.turnoverRate);
    },

    generatePurchaseOrder(supplierId = null) {
        const lowStockItems = this.getLowStockItems();
        if (lowStockItems.length === 0) return null;

        const itemsBySupplier = {};
        lowStockItems.forEach(item => {
            if (!supplierId || item.supplierId === supplierId) {
                if (!itemsBySupplier[item.supplierId]) itemsBySupplier[item.supplierId] = [];
                const orderQuantity = Math.max(0, ((item.minStock || item.minQuantity || 0) * 2) - (item.currentStock || item.quantity || 0));
                itemsBySupplier[item.supplierId].push({
                    itemId: item.id, itemName: item.name, sku: item.sku || '',
                    orderQuantity, price: item.purchasePrice || item.price || 0,
                    totalPrice: orderQuantity * (item.purchasePrice || item.price || 0)
                });
            }
        });

        const purchaseOrders = [];
        Object.keys(itemsBySupplier).forEach(sid => {
            const items = itemsBySupplier[sid];
            const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
            const order = this.create('purchaseOrders', {
                supplierId: parseInt(sid),
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                items: items,
                totalAmount: totalAmount,
                createdBy: 1
            });
            purchaseOrders.push(order);
        });

        return purchaseOrders;
    },

    // ==================== GENERATION STUBS (backward compatibility) ====================
    // These methods no longer generate fake data — they're no-ops.
    // Use the UI to add real data.

    generateTestClients() { console.log('Test data generation disabled'); return []; },
    generateEmployeeSchedules() { console.log('Use the UI to manage schedules'); return []; },
    generateTestAppointments() { console.log('Test data generation disabled'); return []; },
    generateExtendedServices() { console.log('Use the UI to manage services'); return []; },
    generateExtendedEmployees() { console.log('Use the UI to manage employees'); return []; },
    generateHistoricalData() { console.log('Test data generation disabled'); return {}; },
    generateInventoryCategories() { console.log('Use the UI to manage inventory'); return []; },
    generateSuppliers() { console.log('Use the UI to manage suppliers'); return []; },
    generateInventoryItems() { console.log('Use the UI to manage inventory'); return []; },
    generateServiceMaterials() { console.log('Use the UI to manage service materials'); return []; },
    generateInventoryTransactions() { console.log('Test data generation disabled'); return []; }
};

// Export to window for global access
window.beautyDB = Database;
