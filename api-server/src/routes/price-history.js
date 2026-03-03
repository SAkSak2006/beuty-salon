const createCrudRouter = require('./crud-factory');

// Price history: write — admin, owner
module.exports = createCrudRouter('price_history', {
  writeRoles: ['admin', 'owner']
});
