const createCrudRouter = require('./crud-factory');

// Employees: read — all authenticated, write — only owner
module.exports = createCrudRouter('employees', {
  writeRoles: ['owner'],
  beforeCreate(data) {
    if (data.specialization && typeof data.specialization === 'string') {
      try { data.specialization = JSON.parse(data.specialization); } catch { /* keep as is */ }
    }
    return data;
  }
});
