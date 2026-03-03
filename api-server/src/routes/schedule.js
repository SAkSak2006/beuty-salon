const createCrudRouter = require('./crud-factory');
const CacheService = require('../services/cache-service');

// Schedule: write — admin, owner
module.exports = createCrudRouter('schedule', {
  writeRoles: ['admin', 'owner'],
  async afterWrite() {
    await CacheService.invalidate('slots:*');
  }
});
