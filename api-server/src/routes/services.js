const createCrudRouter = require('./crud-factory');
const CacheService = require('../services/cache-service');

// Services: read — all authenticated, write — admin, owner
module.exports = createCrudRouter('services', {
  writeRoles: ['admin', 'owner'],
  beforeCreate(data) {
    if (data.requiredMaterials && typeof data.requiredMaterials === 'string') {
      try { data.requiredMaterials = JSON.parse(data.requiredMaterials); } catch { /* keep as is */ }
    }
    return data;
  },
  async afterWrite() {
    await CacheService.invalidate('services:*');
    await CacheService.invalidate('masters:*');
  }
});
