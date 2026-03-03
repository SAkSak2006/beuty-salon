const createCrudRouter = require('./crud-factory');
const CacheService = require('../services/cache-service');

// Competency matrix: write — admin, owner
module.exports = createCrudRouter('competency_matrix', {
  writeRoles: ['admin', 'owner'],
  async afterWrite() {
    await CacheService.invalidate('masters:*');
  }
});
