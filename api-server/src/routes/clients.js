const createCrudRouter = require('./crud-factory');

// Clients: read — all authenticated, write — admin, owner
module.exports = createCrudRouter('clients', {
  writeRoles: ['admin', 'owner']
});
