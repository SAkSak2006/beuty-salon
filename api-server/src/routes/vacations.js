const createCrudRouter = require('./crud-factory');
const CacheService = require('../services/cache-service');

// Vacations: write — admin, owner
module.exports = createCrudRouter('vacations', {
  writeRoles: ['admin', 'owner'],
  async afterWrite() {
    await CacheService.invalidate('slots:*');
  }
});
