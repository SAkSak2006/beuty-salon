const createCrudRouter = require('./crud-factory');

// Inventory transactions: write — admin, owner
module.exports = createCrudRouter('inventory_transactions', {
  writeRoles: ['admin', 'owner']
});
