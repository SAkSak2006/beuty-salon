const createCrudRouter = require('./crud-factory');
const CacheService = require('../services/cache-service');

// Service categories: write — admin, owner
module.exports = createCrudRouter('service_categories', {
  writeRoles: ['admin', 'owner'],
  async afterWrite() {
    await CacheService.invalidate('services:*');
  }
});
