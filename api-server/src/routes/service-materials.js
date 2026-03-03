const createCrudRouter = require('./crud-factory');

// Service materials: write — admin, owner
module.exports = createCrudRouter('service_materials', {
  writeRoles: ['admin', 'owner']
});
