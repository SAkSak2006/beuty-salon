const createCrudRouter = require('./crud-factory');

// Inventory: write — admin, owner
module.exports = createCrudRouter('inventory', {
  writeRoles: ['admin', 'owner']
});
