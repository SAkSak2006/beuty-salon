const createCrudRouter = require('./crud-factory');

// Inventory categories: write — admin, owner
module.exports = createCrudRouter('inventory_categories', {
  writeRoles: ['admin', 'owner']
});
