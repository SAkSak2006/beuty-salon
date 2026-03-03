const createCrudRouter = require('./crud-factory');

// Payments: write — admin, owner
module.exports = createCrudRouter('payments', {
  writeRoles: ['admin', 'owner']
});
