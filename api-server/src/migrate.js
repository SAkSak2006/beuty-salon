require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { runMigrations, pool } = require('./config/database');

(async () => {
  try {
    await runMigrations();
    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
