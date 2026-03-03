const createCrudRouter = require('./crud-factory');

// Appointments: master sees only own (by employeeId), admin/owner see all
module.exports = createCrudRouter('appointments', {
  filterByRole(req) {
    if (req.user && req.user.role === 'master' && req.user.employeeId) {
      return { column: '"employeeId"', value: req.user.employeeId };
    }
    return null;
  }
});
