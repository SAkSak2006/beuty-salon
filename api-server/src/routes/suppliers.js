const createCrudRouter = require('./crud-factory');

// Suppliers: write — admin, owner
module.exports = createCrudRouter('suppliers', {
  writeRoles: ['admin', 'owner']
});
