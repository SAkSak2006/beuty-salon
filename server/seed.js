/**
 * Seed script — заполняет БД реалистичными данными через API
 * Запуск: node seed.js (при работающем сервере на localhost:3000)
 */

const API = 'http://localhost:3000/api';

async function post(endpoint, data) {
    const res = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function seed() {
    console.log('Заполнение базы данных...\n');

    // ============ 1. КАТЕГОРИИ УСЛУГ ============
    console.log('→ Категории услуг...');
    const categories = [
        { name: 'Парикмахерские услуги', icon: 'fa-cut', color: '#ec4899' },
        { name: 'Маникюр и педикюр', icon: 'fa-hand-sparkles', color: '#8b5cf6' },
        { name: 'Косметология', icon: 'fa-spa', color: '#f472b6' },
        { name: 'Массаж', icon: 'fa-hands', color: '#a78bfa' },
        { name: 'Визаж', icon: 'fa-palette', color: '#fb7185' }
    ];
    const catResults = [];
    for (const cat of categories) {
        catResults.push(await post('service-categories', cat));
    }
    console.log(`  ✓ ${catResults.length} категорий`);

    // ============ 2. УСЛУГИ ============
    console.log('→ Услуги...');
    const services = [
        // Парикмахерские
        { name: 'Стрижка женская короткая', categoryId: 1, price: 1500, duration: 60, description: 'Стрижка коротких волос для женщин', requiredMaterials: [], isActive: true, sortOrder: 1 },
        { name: 'Стрижка женская средняя', categoryId: 1, price: 1800, duration: 75, description: 'Стрижка волос средней длины', requiredMaterials: [], isActive: true, sortOrder: 2 },
        { name: 'Стрижка женская длинная', categoryId: 1, price: 2200, duration: 90, description: 'Стрижка длинных волос', requiredMaterials: [], isActive: true, sortOrder: 3 },
        { name: 'Стрижка мужская', categoryId: 1, price: 800, duration: 40, description: 'Классическая мужская стрижка', requiredMaterials: [], isActive: true, sortOrder: 4 },
        { name: 'Стрижка детская', categoryId: 1, price: 600, duration: 30, description: 'Детская стрижка до 12 лет', requiredMaterials: [], isActive: true, sortOrder: 5 },
        { name: 'Окрашивание в один тон', categoryId: 1, price: 3500, duration: 120, description: 'Полное окрашивание волос', requiredMaterials: [], isActive: true, sortOrder: 6 },
        { name: 'Мелирование', categoryId: 1, price: 4000, duration: 150, description: 'Классическое мелирование', requiredMaterials: [], isActive: true, sortOrder: 7 },
        { name: 'Колорирование', categoryId: 1, price: 4500, duration: 180, description: 'Многоцветное окрашивание', requiredMaterials: [], isActive: true, sortOrder: 8 },
        { name: 'Омбре/Шатуш', categoryId: 1, price: 5000, duration: 180, description: 'Градиентное окрашивание', requiredMaterials: [], isActive: true, sortOrder: 9 },
        { name: 'Укладка', categoryId: 1, price: 1200, duration: 45, description: 'Профессиональная укладка', requiredMaterials: [], isActive: true, sortOrder: 10 },
        // Маникюр и педикюр
        { name: 'Маникюр классический', categoryId: 2, price: 1000, duration: 60, description: 'Классический обрезной маникюр', requiredMaterials: [], isActive: true, sortOrder: 11 },
        { name: 'Маникюр аппаратный', categoryId: 2, price: 1200, duration: 60, description: 'Аппаратный маникюр', requiredMaterials: [], isActive: true, sortOrder: 12 },
        { name: 'Педикюр классический', categoryId: 2, price: 1500, duration: 90, description: 'Классический обрезной педикюр', requiredMaterials: [], isActive: true, sortOrder: 13 },
        { name: 'Покрытие гель-лак', categoryId: 2, price: 800, duration: 30, description: 'Покрытие ногтей гель-лаком', requiredMaterials: [], isActive: true, sortOrder: 14 },
        { name: 'Дизайн ногтей', categoryId: 2, price: 500, duration: 30, description: 'Художественный дизайн', requiredMaterials: [], isActive: true, sortOrder: 15 },
        // Косметология
        { name: 'Чистка лица', categoryId: 3, price: 2500, duration: 90, description: 'Глубокая чистка лица', requiredMaterials: [], isActive: true, sortOrder: 16 },
        { name: 'Пилинг лица', categoryId: 3, price: 2000, duration: 60, description: 'Химический пилинг лица', requiredMaterials: [], isActive: true, sortOrder: 17 },
        { name: 'Маска для лица', categoryId: 3, price: 1500, duration: 45, description: 'Увлажняющая маска', requiredMaterials: [], isActive: true, sortOrder: 18 },
        { name: 'Массаж лица', categoryId: 3, price: 1800, duration: 60, description: 'Омолаживающий массаж лица', requiredMaterials: [], isActive: true, sortOrder: 19 },
        // Массаж
        { name: 'Массаж спины', categoryId: 4, price: 2000, duration: 60, description: 'Расслабляющий массаж спины', requiredMaterials: [], isActive: true, sortOrder: 20 },
        { name: 'Массаж всего тела', categoryId: 4, price: 3500, duration: 90, description: 'Общий расслабляющий массаж', requiredMaterials: [], isActive: true, sortOrder: 21 },
        { name: 'Антицеллюлитный массаж', categoryId: 4, price: 2500, duration: 60, description: 'Массаж проблемных зон', requiredMaterials: [], isActive: true, sortOrder: 22 },
        // Визаж
        { name: 'Дневной макияж', categoryId: 5, price: 1500, duration: 60, description: 'Легкий дневной макияж', requiredMaterials: [], isActive: true, sortOrder: 23 },
        { name: 'Вечерний макияж', categoryId: 5, price: 2500, duration: 90, description: 'Яркий вечерний макияж', requiredMaterials: [], isActive: true, sortOrder: 24 },
        { name: 'Свадебный макияж', categoryId: 5, price: 4000, duration: 120, description: 'Свадебный образ', requiredMaterials: [], isActive: true, sortOrder: 25 },
        { name: 'Коррекция бровей', categoryId: 5, price: 500, duration: 30, description: 'Коррекция формы бровей', requiredMaterials: [], isActive: true, sortOrder: 26 },
    ];
    const svcResults = [];
    for (const svc of services) {
        svcResults.push(await post('services', svc));
    }
    console.log(`  ✓ ${svcResults.length} услуг`);

    // ============ 3. СОТРУДНИКИ ============
    console.log('→ Сотрудники...');
    const employees = [
        { name: 'Анна Петрова', position: 'Парикмахер-стилист', phone: '+7 (999) 123-45-67', email: 'anna@salon.ru', specialization: [1,2,3,4,5,6,7,8,9,10], salary: 50000, commission: 30, status: 'working', skillLevel: 'senior', hireDate: '2022-01-15' },
        { name: 'Мария Иванова', position: 'Мастер маникюра', phone: '+7 (999) 234-56-78', email: 'maria@salon.ru', specialization: [11,12,13,14,15], salary: 45000, commission: 25, status: 'working', skillLevel: 'middle', hireDate: '2022-03-20' },
        { name: 'Елена Сидорова', position: 'Косметолог', phone: '+7 (999) 345-67-89', email: 'elena@salon.ru', specialization: [16,17,18,19], salary: 55000, commission: 35, status: 'working', skillLevel: 'senior', hireDate: '2021-11-10' },
        { name: 'Ольга Смирнова', position: 'Массажист', phone: '+7 (999) 456-78-90', email: 'olga@salon.ru', specialization: [20,21,22], salary: 48000, commission: 30, status: 'working', skillLevel: 'middle', hireDate: '2023-02-14' },
        { name: 'Ирина Козлова', position: 'Визажист', phone: '+7 (999) 567-89-01', email: 'irina@salon.ru', specialization: [23,24,25,26], salary: 52000, commission: 28, status: 'working', skillLevel: 'senior', hireDate: '2022-07-01' },
        { name: 'Татьяна Волкова', position: 'Мастер универсал', phone: '+7 (999) 678-90-12', email: 'tatiana@salon.ru', specialization: [1,2,4,5,10,11,12,14], salary: 42000, commission: 22, status: 'working', skillLevel: 'middle', hireDate: '2023-05-15' },
        { name: 'Светлана Морозова', position: 'Колорист', phone: '+7 (999) 789-01-23', email: 'svetlana@salon.ru', specialization: [6,7,8,9], salary: 60000, commission: 35, status: 'working', skillLevel: 'senior', hireDate: '2020-08-20' },
    ];
    const empResults = [];
    for (const emp of employees) {
        empResults.push(await post('employees', emp));
    }
    console.log(`  ✓ ${empResults.length} сотрудников`);

    // ============ 4. РАСПИСАНИЕ СОТРУДНИКОВ ============
    console.log('→ Расписание...');
    let schedCount = 0;
    for (const emp of empResults) {
        for (let day = 1; day <= 5; day++) {
            await post('schedule', { employeeId: emp.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00', isWorkingDay: true });
            schedCount++;
        }
        await post('schedule', { employeeId: emp.id, dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isWorkingDay: true });
        schedCount++;
        await post('schedule', { employeeId: emp.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false });
        schedCount++;
    }
    console.log(`  ✓ ${schedCount} записей расписания`);

    // ============ 5. КЛИЕНТЫ ============
    console.log('→ Клиенты...');
    const firstNames = ['Анна', 'Мария', 'Елена', 'Ольга', 'Наталья', 'Татьяна', 'Ирина', 'Екатерина', 'Светлана', 'Людмила',
        'Галина', 'Юлия', 'Валентина', 'Нина', 'Александра', 'Вера', 'Надежда', 'Любовь', 'Дарья', 'Виктория',
        'Анастасия', 'Маргарита', 'Кристина', 'Алина', 'Полина', 'Евгения', 'Алла', 'Софья', 'Варвара', 'Оксана'];
    const lastNames = ['Иванова', 'Петрова', 'Сидорова', 'Смирнова', 'Кузнецова', 'Попова', 'Васильева', 'Соколова', 'Михайлова', 'Новикова',
        'Федорова', 'Морозова', 'Волкова', 'Алексеева', 'Лебедева', 'Семенова', 'Егорова', 'Павлова', 'Козлова', 'Степанова',
        'Николаева', 'Орлова', 'Андреева', 'Макарова', 'Никитина', 'Захарова', 'Зайцева', 'Соловьева', 'Борисова', 'Яковлева'];
    const emailDomains = ['mail.ru', 'yandex.ru', 'gmail.com', 'inbox.ru'];
    const notes = ['Предпочитает естественные оттенки', 'Аллергия на аммиак', 'VIP клиент', 'Любит эксперименты', 'Чувствительная кожа', 'Постоянный клиент', '', '', ''];

    const clientResults = [];
    for (let i = 0; i < 50; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = Math.floor(Math.random() * 40) + 20;
        const birthYear = 2026 - age;
        const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

        const daysAgo = Math.floor(Math.random() * 700) + 30;
        const regDate = new Date();
        regDate.setDate(regDate.getDate() - daysAgo);

        const discounts = [0, 0, 0, 5, 5, 10, 10, 15, 20];

        clientResults.push(await post('clients', {
            name: `${fn} ${ln}`,
            phone: `+7 (9${Math.floor(Math.random()*90)+10}) ${Math.floor(Math.random()*900)+100}-${Math.floor(Math.random()*90)+10}-${Math.floor(Math.random()*90)+10}`,
            email: `${fn.toLowerCase().replace(/[а-яё]/g, c => {const m={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};return m[c]||c})}${Math.floor(Math.random()*100)}@${emailDomains[Math.floor(Math.random()*emailDomains.length)]}`,
            birthdate: `${birthYear}-${birthMonth}-${birthDay}`,
            registrationDate: regDate.toISOString().split('T')[0],
            notes: notes[Math.floor(Math.random() * notes.length)],
            discount: discounts[Math.floor(Math.random() * discounts.length)],
            totalVisits: 0,
            totalSpent: 0,
            lastVisit: ''
        }));
    }
    console.log(`  ✓ ${clientResults.length} клиентов`);

    // ============ 6. ЗАПИСИ И ПЛАТЕЖИ (6 месяцев истории) ============
    console.log('→ Записи и платежи (6 месяцев)...');
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 6);

    let appointmentCount = 0;
    let paymentCount = 0;

    // Track client stats
    const clientStats = {};
    clientResults.forEach(c => { clientStats[c.id] = { visits: 0, spent: 0, lastVisit: '' }; });

    const workHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0) { // Skip Sundays
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const isInPast = currentDate < today;
        const month = currentDate.getMonth();

        // Seasonal multiplier
        const seasonMult = [0.8, 0.7, 0.9, 1.0, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 1.1][month];
        const dayMult = [0.3, 0.8, 0.9, 0.9, 1.0, 1.3, 1.2][dayOfWeek];
        const appointmentsToday = Math.round(8 * seasonMult * dayMult);

        for (let i = 0; i < appointmentsToday; i++) {
            const hour = workHours[Math.floor(Math.random() * workHours.length)];
            const minutes = Math.random() > 0.5 ? '00' : '30';
            const timeStr = `${String(hour).padStart(2, '0')}:${minutes}`;

            const emp = empResults[Math.floor(Math.random() * empResults.length)];
            const client = clientResults[Math.floor(Math.random() * clientResults.length)];
            const svc = svcResults[Math.floor(Math.random() * svcResults.length)];

            let status;
            if (isInPast) {
                const rand = Math.random();
                status = rand < 0.75 ? 'completed' : rand < 0.87 ? 'cancelled' : 'no-show';
            } else {
                status = Math.random() > 0.3 ? 'confirmed' : 'pending';
            }

            const apt = await post('appointments', {
                clientId: client.id,
                employeeId: emp.id,
                serviceId: svc.id,
                date: dateStr,
                time: timeStr,
                duration: svc.duration || 60,
                status: status,
                notes: Math.random() > 0.85 ? 'Особые пожелания клиента' : '',
                createdAt: new Date(currentDate.getTime() - 86400000 * Math.random() * 3).toISOString()
            });
            appointmentCount++;

            // Create payment for completed
            if (status === 'completed') {
                await post('payments', {
                    appointmentId: apt.id,
                    amount: svc.price,
                    method: Math.random() > 0.4 ? 'card' : 'cash',
                    date: dateStr,
                    status: 'completed'
                });
                paymentCount++;

                // Track client stats
                if (clientStats[client.id]) {
                    clientStats[client.id].visits++;
                    clientStats[client.id].spent += svc.price;
                    if (dateStr > clientStats[client.id].lastVisit) {
                        clientStats[client.id].lastVisit = dateStr;
                    }
                }
            }
        }

        // Also add some future appointments (next 30 days)
        if (currentDate.toDateString() === today.toDateString()) {
            for (let d = 1; d <= 30; d++) {
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + d);
                if (futureDate.getDay() === 0) continue;

                const futureDateStr = futureDate.toISOString().split('T')[0];
                const futureCount = Math.floor(Math.random() * 6) + 4;

                for (let j = 0; j < futureCount; j++) {
                    const hour = workHours[Math.floor(Math.random() * workHours.length)];
                    const minutes = Math.random() > 0.5 ? '00' : '30';
                    const emp = empResults[Math.floor(Math.random() * empResults.length)];
                    const client = clientResults[Math.floor(Math.random() * clientResults.length)];
                    const svc = svcResults[Math.floor(Math.random() * svcResults.length)];

                    await post('appointments', {
                        clientId: client.id, employeeId: emp.id, serviceId: svc.id,
                        date: futureDateStr,
                        time: `${String(hour).padStart(2, '0')}:${minutes}`,
                        duration: svc.duration || 60,
                        status: Math.random() > 0.3 ? 'confirmed' : 'pending',
                        notes: ''
                    });
                    appointmentCount++;
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`  ✓ ${appointmentCount} записей`);
    console.log(`  ✓ ${paymentCount} платежей`);

    // ============ 7. ОБНОВИТЬ СТАТИСТИКУ КЛИЕНТОВ ============
    console.log('→ Обновление статистики клиентов...');
    for (const client of clientResults) {
        const stats = clientStats[client.id];
        if (stats && stats.visits > 0) {
            await fetch(`${API}/clients/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...client,
                    totalVisits: stats.visits,
                    totalSpent: stats.spent,
                    lastVisit: stats.lastVisit
                })
            });
        }
    }
    console.log(`  ✓ Статистика обновлена`);

    // ============ 8. СКЛАД ============
    console.log('→ Товары на складе...');
    const inventoryItems = [
        { name: 'Шампунь профессиональный', category: 'Уход за волосами', quantity: 25, unit: 'шт', minQuantity: 10, price: 800, supplier: 'BeautyPro', currentStock: 25, minStock: 10, purchasePrice: 800 },
        { name: 'Краска для волос', category: 'Окрашивание', quantity: 45, unit: 'шт', minQuantity: 20, price: 450, supplier: 'ColorMaster', currentStock: 45, minStock: 20, purchasePrice: 450 },
        { name: 'Гель-лак', category: 'Маникюр', quantity: 60, unit: 'шт', minQuantity: 30, price: 350, supplier: 'NailArt', currentStock: 60, minStock: 30, purchasePrice: 350 },
        { name: 'Маска для лица', category: 'Косметология', quantity: 15, unit: 'шт', minQuantity: 10, price: 600, supplier: 'SkinCare Pro', currentStock: 15, minStock: 10, purchasePrice: 600 },
        { name: 'Масло для массажа', category: 'Массаж', quantity: 8, unit: 'л', minQuantity: 5, price: 1200, supplier: 'MassageWorld', currentStock: 8, minStock: 5, purchasePrice: 1200 },
        { name: 'База под гель-лак', category: 'Маникюр', quantity: 35, unit: 'шт', minQuantity: 15, price: 400, supplier: 'NailArt', currentStock: 35, minStock: 15, purchasePrice: 400 },
        { name: 'Топ для гель-лака', category: 'Маникюр', quantity: 32, unit: 'шт', minQuantity: 15, price: 400, supplier: 'NailArt', currentStock: 32, minStock: 15, purchasePrice: 400 },
        { name: 'Одноразовые перчатки', category: 'Расходники', quantity: 150, unit: 'пар', minQuantity: 100, price: 5, supplier: 'MedSupply', currentStock: 150, minStock: 100, purchasePrice: 5 },
        { name: 'Кондиционер для волос', category: 'Уход за волосами', quantity: 18, unit: 'шт', minQuantity: 10, price: 650, supplier: 'BeautyPro', currentStock: 18, minStock: 10, purchasePrice: 650 },
        { name: 'Крем для рук', category: 'Маникюр', quantity: 12, unit: 'шт', minQuantity: 8, price: 350, supplier: 'SkinCare Pro', currentStock: 12, minStock: 8, purchasePrice: 350 },
    ];
    for (const item of inventoryItems) {
        await post('inventory', item);
    }
    console.log(`  ✓ ${inventoryItems.length} товаров`);

    console.log('\n✅ База данных заполнена!');
    console.log('Перезагрузите страницу http://localhost:3000 в браузере.');
}

seed().catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
});
