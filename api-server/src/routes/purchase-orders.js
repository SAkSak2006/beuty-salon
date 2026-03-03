const createCrudRouter = require('./crud-factory');

// Purchase orders: write — admin, owner
module.exports = createCrudRouter('purchase_orders', {
  writeRoles: ['admin', 'owner'],
  beforeCreate(data) {
    if (data.items && typeof data.items === 'string') {
      try { data.items = JSON.parse(data.items); } catch { /* keep as is */ }
    }
    return data;
  }
});
