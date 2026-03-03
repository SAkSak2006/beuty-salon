/**
 * Demo data seed script for diploma defense
 * Creates 3 months of realistic salon data
 *
 * Usage: node src/seed-demo.js
 * WARNING: Clears existing data before seeding!
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcrypt');
const { pool, runMigrations } = require('./config/database');

async function q(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function insert(sql, params = []) {
  const result = await pool.query(sql + ' RETURNING id', params);
  return result.rows[0].id;
}

async function seed() {
  console.log('=== Seeding demo data ===\n');
  await runMigrations();

  // Clear existing data (in dependency order)
  console.log('Clearing existing data...');
  const tables = [
    'audit_log', 'payments', 'appointments', 'competency_matrix', 'schedule',
    'vacations', 'price_history', 'service_materials', 'inventory_transactions',
    'purchase_orders', 'telegram_users', 'users', 'clients', 'services',
    'service_categories', 'employees', 'inventory', 'inventory_categories', 'suppliers'
  ];
  for (const t of tables) {
    await pool.query(`DELETE FROM ${t}`).catch(() => {});
  }
  // Reset sequences
  for (const t of tables) {
    await pool.query(`ALTER SEQUENCE IF EXISTS ${t}_id_seq RESTART WITH 1`).catch(() => {});
  }

  // =============================================
  // === SERVICE CATEGORIES ===
  // =============================================
  console.log('Creating service categories...');
  const catHair = await insert(
    'INSERT INTO service_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Парикмахерские услуги', 'fa-cut', '#ec4899']
  );
  const catNails = await insert(
    'INSERT INTO service_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Маникюр и педикюр', 'fa-hand-sparkles', '#8b5cf6']
  );
  const catCosm = await insert(
    'INSERT INTO service_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Косметология', 'fa-spa', '#06b6d4']
  );
  const catBrows = await insert(
    'INSERT INTO service_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Брови и ресницы', 'fa-eye', '#f59e0b']
  );
  console.log(`  4 categories created`);

  // =============================================
  // === SERVICES ===
  // =============================================
  console.log('Creating services...');
  const servicesData = [
    // Hair (catHair)
    { name: 'Женская стрижка',            cat: catHair,  price: 1500, dur: 60,  desc: 'Стрижка любой сложности' },
    { name: 'Мужская стрижка',            cat: catHair,  price: 800,  dur: 40,  desc: '' },
    { name: 'Окрашивание волос',          cat: catHair,  price: 3500, dur: 120, desc: 'Окрашивание в один тон' },
    { name: 'Укладка',                    cat: catHair,  price: 1200, dur: 45,  desc: 'Укладка феном или плойкой' },
    { name: 'Мелирование',               cat: catHair,  price: 4000, dur: 150, desc: 'Частичное осветление прядей' },
    { name: 'Кератиновое выпрямление',    cat: catHair,  price: 5000, dur: 180, desc: 'Восстановление и выпрямление' },
    // Nails (catNails)
    { name: 'Маникюр классический',       cat: catNails, price: 1000, dur: 60,  desc: '' },
    { name: 'Маникюр с гель-лаком',       cat: catNails, price: 1800, dur: 90,  desc: 'Маникюр + покрытие гель-лак' },
    { name: 'Педикюр',                    cat: catNails, price: 2000, dur: 90,  desc: '' },
    { name: 'Наращивание ногтей',         cat: catNails, price: 3000, dur: 120, desc: 'Гелевое наращивание' },
    // Cosmetology (catCosm)
    { name: 'Чистка лица',               cat: catCosm,  price: 2500, dur: 60,  desc: 'Механическая или ультразвуковая' },
    { name: 'Пилинг',                    cat: catCosm,  price: 2000, dur: 45,  desc: 'Химический пилинг' },
    { name: 'Массаж лица',               cat: catCosm,  price: 1500, dur: 30,  desc: 'Расслабляющий массаж' },
    // Brows (catBrows)
    { name: 'Коррекция бровей',           cat: catBrows, price: 600,  dur: 30,  desc: '' },
    { name: 'Окрашивание бровей',         cat: catBrows, price: 500,  dur: 20,  desc: '' },
    { name: 'Наращивание ресниц',         cat: catBrows, price: 2500, dur: 120, desc: '2D/3D объём' },
    { name: 'Ламинирование ресниц',       cat: catBrows, price: 1800, dur: 60,  desc: '' },
  ];

  const svcIds = [];
  for (let i = 0; i < servicesData.length; i++) {
    const s = servicesData[i];
    const id = await insert(
      'INSERT INTO services (name, "categoryId", price, duration, description, "isActive", "sortOrder") VALUES ($1, $2, $3, $4, $5, true, $6)',
      [s.name, s.cat, s.price, s.dur, s.desc, i]
    );
    svcIds.push(id);
  }
  console.log(`  ${svcIds.length} services created`);

  // =============================================
  // === EMPLOYEES ===
  // =============================================
  console.log('Creating employees...');
  const employeesData = [
    { name: 'Иванова Анна Сергеевна',       pos: 'Старший стилист',    spec: ['Стрижки', 'Окрашивание'],   salary: 45000, skill: 'senior',  phone: '+79991234501' },
    { name: 'Петрова Мария Александровна',   pos: 'Стилист',            spec: ['Стрижки', 'Укладки'],       salary: 35000, skill: 'middle',  phone: '+79991234502' },
    { name: 'Сидорова Елена Викторовна',     pos: 'Мастер маникюра',    spec: ['Маникюр', 'Педикюр'],       salary: 30000, skill: 'senior',  phone: '+79991234503' },
    { name: 'Козлова Ольга Дмитриевна',      pos: 'Косметолог',         spec: ['Косметология'],             salary: 40000, skill: 'middle',  phone: '+79991234504' },
    { name: 'Новикова Дарья Игоревна',       pos: 'Мастер бровист',     spec: ['Брови', 'Ресницы'],         salary: 28000, skill: 'middle',  phone: '+79991234505' },
    { name: 'Морозова Татьяна Павловна',     pos: 'Стилист-колорист',   spec: ['Стрижки', 'Мелирование'],   salary: 38000, skill: 'senior',  phone: '+79991234506' },
  ];

  const empIds = [];
  for (const e of employeesData) {
    const id = await insert(
      `INSERT INTO employees (name, position, phone, email, specialization, salary, commission, status, "skillLevel", "hireDate")
       VALUES ($1, $2, $3, '', $4, $5, 10, 'working', $6, '2024-01-15')`,
      [e.name, e.pos, e.phone, JSON.stringify(e.spec), e.salary, e.skill]
    );
    empIds.push(id);
  }
  console.log(`  ${empIds.length} employees created`);

  // =============================================
  // === SCHEDULE (Mon-Sat 9:00-18:00) ===
  // =============================================
  console.log('Creating schedules...');
  for (const empId of empIds) {
    for (let day = 0; day <= 6; day++) {
      await pool.query(
        'INSERT INTO schedule ("employeeId", "dayOfWeek", "startTime", "endTime", "isWorkingDay") VALUES ($1, $2, $3, $4, $5)',
        [empId, day, '09:00', '18:00', day !== 0] // Sunday off
      );
    }
  }
  console.log(`  ${empIds.length * 7} schedule records created`);

  // =============================================
  // === COMPETENCY MATRIX ===
  // =============================================
  console.log('Creating competency matrix...');
  // empIdx => array of service indices
  const competencyMap = {
    0: [0, 1, 2, 3, 4, 5],    // Иванова — all hair
    1: [0, 1, 3],              // Петрова — cuts, styling
    2: [6, 7, 8, 9],           // Сидорова — nails
    3: [10, 11, 12],           // Козлова — cosmetology
    4: [13, 14, 15, 16],       // Новикова — brows/lashes
    5: [0, 1, 2, 4, 5],        // Морозова — hair coloring
  };

  let cmCount = 0;
  for (const [empIdx, svcIndices] of Object.entries(competencyMap)) {
    for (const svcIdx of svcIndices) {
      await pool.query(
        'INSERT INTO competency_matrix ("employeeId", "serviceId", "skillLevel", "customDuration", "canPerform") VALUES ($1, $2, $3, $4, true)',
        [empIds[empIdx], svcIds[svcIdx], employeesData[empIdx].skill, servicesData[svcIdx].dur]
      );
      cmCount++;
    }
  }
  console.log(`  ${cmCount} competency records created`);

  // =============================================
  // === VACATIONS ===
  // =============================================
  console.log('Creating vacations...');
  // Past vacation
  await pool.query(
    'INSERT INTO vacations ("employeeId", "startDate", "endDate", type, reason) VALUES ($1, $2, $3, $4, $5)',
    [empIds[0], '2025-12-25', '2026-01-05', 'vacation', 'Новогодние каникулы']
  );
  // Future vacation
  await pool.query(
    'INSERT INTO vacations ("employeeId", "startDate", "endDate", type, reason) VALUES ($1, $2, $3, $4, $5)',
    [empIds[2], '2026-04-01', '2026-04-14', 'vacation', 'Ежегодный отпуск']
  );
  // Sick leave
  await pool.query(
    'INSERT INTO vacations ("employeeId", "startDate", "endDate", type, reason) VALUES ($1, $2, $3, $4, $5)',
    [empIds[3], '2026-02-10', '2026-02-14', 'sick', 'Больничный']
  );
  console.log(`  3 vacations created`);

  // =============================================
  // === CLIENTS ===
  // =============================================
  console.log('Creating clients...');
  const clientNames = [
    'Алексеева Виктория',   'Белова Кристина',     'Волкова Наталья',      'Григорьева Юлия',
    'Дмитриева Алёна',      'Егорова Светлана',    'Жукова Ирина',         'Зайцева Полина',
    'Ильина Марина',        'Калинина Екатерина',  'Лебедева Анастасия',   'Михайлова Оксана',
    'Николаева Тамара',     'Орлова Валерия',      'Павлова Диана',        'Романова Александра',
    'Соколова Евгения',     'Тимофеева Карина',    'Фёдорова Лариса',     'Чернова Маргарита',
    'Андреева Полина',      'Борисова Анна',       'Васильева Елена',      'Голубева Мария',
    'Денисова София',
  ];

  const clientIds = [];
  for (let i = 0; i < clientNames.length; i++) {
    const regDate = new Date();
    regDate.setDate(regDate.getDate() - Math.floor(30 + Math.random() * 150));
    const birthYear = 1980 + Math.floor(Math.random() * 25);
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = 1 + Math.floor(Math.random() * 27);
    const birth = new Date(birthYear, birthMonth, birthDay);

    const id = await insert(
      `INSERT INTO clients (name, phone, birthdate, "registrationDate", "totalVisits", "totalSpent", discount)
       VALUES ($1, $2, $3, $4, 0, 0, $5)`,
      [
        clientNames[i],
        '+7' + String(9000000000 + Math.floor(Math.random() * 999999999)),
        birth.toISOString().split('T')[0],
        regDate.toISOString().split('T')[0],
        [0, 0, 5, 10][Math.floor(Math.random() * 4)]
      ]
    );
    clientIds.push(id);
  }
  console.log(`  ${clientIds.length} clients created`);

  // =============================================
  // === APPOINTMENTS (last 3 months + 2 weeks ahead) ===
  // =============================================
  console.log('Creating appointments (3 months history + 2 weeks ahead)...');
  const today = new Date();
  let aptCount = 0;
  let payCount = 0;
  const usedSlots = new Set(); // track "empId:date:time" to avoid duplicates

  for (let daysOffset = -90; daysOffset <= 14; daysOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysOffset);
    if (date.getDay() === 0) continue; // Skip Sundays

    const dateStr = date.toISOString().split('T')[0];
    const isPast = daysOffset < 0;
    const isToday = daysOffset === 0;
    const aptsPerDay = 5 + Math.floor(Math.random() * 5); // 5-9 per day

    for (let a = 0; a < aptsPerDay; a++) {
      const empIdx = Math.floor(Math.random() * empIds.length);
      const empId = empIds[empIdx];
      const possibleSvcs = competencyMap[empIdx];
      if (!possibleSvcs || possibleSvcs.length === 0) continue;

      const svcIdx = possibleSvcs[Math.floor(Math.random() * possibleSvcs.length)];
      const svc = servicesData[svcIdx];
      const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];

      const hour = 9 + Math.floor(Math.random() * 8); // 9:00 - 16:30
      const minute = [0, 30][Math.floor(Math.random() * 2)];
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // Avoid duplicate slots
      const slotKey = `${empId}:${dateStr}:${time}`;
      if (usedSlots.has(slotKey)) continue;
      usedSlots.add(slotKey);

      let status;
      if (isPast) {
        status = Math.random() < 0.9 ? 'completed' : 'cancelled';
      } else if (isToday) {
        status = Math.random() < 0.5 ? 'completed' : 'confirmed';
      } else {
        status = Math.random() < 0.8 ? 'confirmed' : 'pending';
      }

      try {
        const aptId = await insert(
          `INSERT INTO appointments ("clientId", "employeeId", "serviceId", date, time, duration, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
          [clientId, empId, svcIds[svcIdx], dateStr, time, svc.dur, status,
           new Date(date.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))]
        );
        aptCount++;

        // Create payment for completed appointments
        if (status === 'completed') {
          const method = ['cash', 'card', 'card', 'transfer'][Math.floor(Math.random() * 4)];
          await pool.query(
            `INSERT INTO payments ("appointmentId", amount, method, date, status, "createdAt")
             VALUES ($1, $2, $3, $4, 'completed', NOW())`,
            [aptId, svc.price, method, dateStr]
          );
          payCount++;
        }
      } catch { /* skip */ }
    }
  }
  console.log(`  ${aptCount} appointments created`);
  console.log(`  ${payCount} payments created`);

  // Update client stats based on actual appointments
  console.log('Updating client statistics...');
  await pool.query(`
    UPDATE clients SET
      "totalVisits" = sub.visits,
      "totalSpent" = sub.spent,
      "lastVisit" = sub.last_visit
    FROM (
      SELECT a."clientId",
        COUNT(*) as visits,
        COALESCE(SUM(p.amount), 0) as spent,
        MAX(a.date) as last_visit
      FROM appointments a
      LEFT JOIN payments p ON p."appointmentId" = a.id
      WHERE a.status = 'completed'
      GROUP BY a."clientId"
    ) sub
    WHERE clients.id = sub."clientId"
  `);

  // =============================================
  // === SUPPLIERS ===
  // =============================================
  console.log('Creating suppliers...');
  const supIds = [];
  const suppliersData = [
    { name: 'ПроБьюти Дистрибуция', phone: '+74951234567', email: 'info@probeauty.ru', days: 3 },
    { name: 'КосмоСнаб',           phone: '+74959876543', email: 'order@cosmosnab.ru', days: 5 },
    { name: 'НейлСупплай',         phone: '+74955556677', email: 'sales@nailsupply.ru', days: 2 },
  ];
  for (const s of suppliersData) {
    const id = await insert(
      'INSERT INTO suppliers (name, phone, email, "deliveryDays") VALUES ($1, $2, $3, $4)',
      [s.name, s.phone, s.email, s.days]
    );
    supIds.push(id);
  }
  console.log(`  ${supIds.length} suppliers created`);

  // =============================================
  // === INVENTORY CATEGORIES ===
  // =============================================
  console.log('Creating inventory categories...');
  const invCatConsumables = await insert(
    'INSERT INTO inventory_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Расходные материалы', 'fa-box', '#10b981']
  );
  const invCatTools = await insert(
    'INSERT INTO inventory_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Инструменты', 'fa-tools', '#6366f1']
  );
  const invCatCosmetics = await insert(
    'INSERT INTO inventory_categories (name, icon, color) VALUES ($1, $2, $3)',
    ['Косметические средства', 'fa-pump-soap', '#f43f5e']
  );

  // =============================================
  // === INVENTORY ===
  // =============================================
  console.log('Creating inventory...');
  const inventoryItems = [
    { name: 'Краска для волос (тюбик)',        qty: 40, min: 10, price: 350,  cat: invCatConsumables, sup: supIds[0] },
    { name: 'Окислитель 6% (1л)',              qty: 15, min: 3,  price: 280,  cat: invCatConsumables, sup: supIds[0] },
    { name: 'Шампунь профессиональный (1л)',    qty: 12, min: 3,  price: 520,  cat: invCatCosmetics,  sup: supIds[0] },
    { name: 'Бальзам восстанавливающий (1л)',   qty: 8,  min: 2,  price: 480,  cat: invCatCosmetics,  sup: supIds[0] },
    { name: 'Гель-лак (12 цветов набор)',       qty: 6,  min: 2,  price: 1200, cat: invCatConsumables, sup: supIds[2] },
    { name: 'Базовое покрытие (15мл)',          qty: 10, min: 3,  price: 350,  cat: invCatConsumables, sup: supIds[2] },
    { name: 'Топовое покрытие (15мл)',          qty: 10, min: 3,  price: 380,  cat: invCatConsumables, sup: supIds[2] },
    { name: 'Одноразовые перчатки (100 шт)',    qty: 20, min: 5,  price: 200,  cat: invCatConsumables, sup: supIds[1] },
    { name: 'Одноразовые салфетки (200 шт)',    qty: 15, min: 5,  price: 180,  cat: invCatConsumables, sup: supIds[1] },
    { name: 'Маска для лица (10 шт)',           qty: 25, min: 5,  price: 450,  cat: invCatCosmetics,  sup: supIds[1] },
    { name: 'Пилочки для ногтей (10 шт)',       qty: 30, min: 10, price: 150,  cat: invCatTools,      sup: supIds[2] },
    { name: 'Ножницы парикмахерские',           qty: 4,  min: 1,  price: 3500, cat: invCatTools,      sup: supIds[0] },
    { name: 'Фольга для мелирования (рулон)',   qty: 8,  min: 2,  price: 250,  cat: invCatConsumables, sup: supIds[0] },
    { name: 'Кератин для выпрямления (500мл)',  qty: 3,  min: 1,  price: 2800, cat: invCatCosmetics,  sup: supIds[0] },
    { name: 'Клей для ресниц (10мл)',           qty: 7,  min: 2,  price: 650,  cat: invCatConsumables, sup: supIds[1] },
  ];

  for (const item of inventoryItems) {
    await pool.query(
      `INSERT INTO inventory (name, quantity, "minQuantity", price, "currentStock", "minStock", "purchasePrice", "categoryId", "supplierId")
       VALUES ($1, $2, $3, $4, $2, $3, $4, $5, $6)`,
      [item.name, item.qty, item.min, item.price, item.cat, item.sup]
    );
  }
  console.log(`  ${inventoryItems.length} inventory items created`);

  // =============================================
  // === PRICE HISTORY ===
  // =============================================
  console.log('Creating price history...');
  // Simulate a price increase 2 months ago
  const priceChangeDate = new Date();
  priceChangeDate.setMonth(priceChangeDate.getMonth() - 2);
  const priceDateStr = priceChangeDate.toISOString().split('T')[0];

  for (let i = 0; i < 5; i++) {
    const svc = servicesData[i];
    const oldPrice = Math.round(svc.price * 0.85);
    await pool.query(
      'INSERT INTO price_history ("serviceId", "oldPrice", "newPrice", "changeDate", reason, "changedBy") VALUES ($1, $2, $3, $4, $5, $6)',
      [svcIds[i], oldPrice, svc.price, priceDateStr, 'Плановое повышение цен', 'admin']
    );
  }
  console.log(`  5 price history records created`);

  // =============================================
  // === USERS ===
  // =============================================
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 10);

  await pool.query(
    'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, true)',
    ['admin', passwordHash, 'owner']
  );
  await pool.query(
    'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, true)',
    ['manager', passwordHash, 'admin']
  );
  await pool.query(
    'INSERT INTO users (username, password_hash, role, employee_id, is_active) VALUES ($1, $2, $3, $4, true)',
    ['master', passwordHash, 'master', empIds[0]]
  );
  console.log(`  3 users created`);

  // =============================================
  // === SUMMARY ===
  // =============================================
  console.log('\n========================================');
  console.log('  Demo data seeded successfully!');
  console.log('========================================');
  console.log(`  Categories:    4`);
  console.log(`  Services:      ${svcIds.length}`);
  console.log(`  Employees:     ${empIds.length}`);
  console.log(`  Clients:       ${clientIds.length}`);
  console.log(`  Appointments:  ${aptCount}`);
  console.log(`  Payments:      ${payCount}`);
  console.log(`  Suppliers:     ${supIds.length}`);
  console.log(`  Inventory:     ${inventoryItems.length}`);
  console.log(`  Vacations:     3`);
  console.log('');
  console.log('  Users:');
  console.log('    admin   / admin123 → owner');
  console.log('    manager / admin123 → admin');
  console.log('    master  / admin123 → master');
  console.log('========================================\n');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
