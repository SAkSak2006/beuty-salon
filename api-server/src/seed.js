const bcrypt = require('bcrypt');
const { queryOne, execute } = require('./config/database');

/**
 * Seed default users if they don't exist:
 *   admin   / admin123  — role: owner   (полный доступ)
 *   manager / admin123  — role: admin   (всё кроме управления сотрудниками)
 *   master  / admin123  — role: master  (свои записи, чтение клиентов/услуг)
 */
async function seedAdmin() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Owner
  try {
    const existing = await queryOne('SELECT id FROM users WHERE username = $1', ['admin']);
    if (!existing) {
      await execute(
        'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, $4)',
        ['admin', passwordHash, 'owner', true]
      );
      console.log('User created: admin / admin123 (owner)');
    }
  } catch (err) {
    console.error('Seed owner error:', err.message);
  }

  // 2. Admin
  try {
    const existing = await queryOne('SELECT id FROM users WHERE username = $1', ['manager']);
    if (!existing) {
      await execute(
        'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, $4)',
        ['manager', passwordHash, 'admin', true]
      );
      console.log('User created: manager / admin123 (admin)');
    }
  } catch (err) {
    console.error('Seed admin error:', err.message);
  }

  // 3. Master — linked to first active employee (if exists)
  try {
    const existing = await queryOne('SELECT id FROM users WHERE username = $1', ['master']);
    if (!existing) {
      const employee = await queryOne("SELECT id FROM employees WHERE status = 'working' ORDER BY id LIMIT 1");
      await execute(
        'INSERT INTO users (username, password_hash, role, employee_id, is_active) VALUES ($1, $2, $3, $4, $5)',
        ['master', passwordHash, 'master', employee ? employee.id : null, true]
      );
      console.log(`User created: master / admin123 (master${employee ? ', employee_id=' + employee.id : ', no employee linked'})`);
    }
  } catch (err) {
    console.error('Seed master error:', err.message);
  }
}

module.exports = { seedAdmin };

// Run directly if called as script
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  const { runMigrations } = require('./config/database');
  (async () => {
    await runMigrations();
    await seedAdmin();
    console.log('\nDone. Users:');
    console.log('  admin   / admin123 → owner');
    console.log('  manager / admin123 → admin');
    console.log('  master  / admin123 → master');
    process.exit(0);
  })();
}
