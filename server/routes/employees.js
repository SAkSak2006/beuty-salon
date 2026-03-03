const createCrudRouter = require('./crud-factory');

module.exports = createCrudRouter('employees', {
  beforeCreate(data) {
    if (data.specialization && typeof data.specialization !== 'string') {
      data.specialization = JSON.stringify(data.specialization);
    }
    return data;
  },
  afterGet(row) {
    if (row.specialization) {
      try { row.specialization = JSON.parse(row.specialization); } catch { row.specialization = []; }
    } else {
      row.specialization = [];
    }
    return row;
  }
});
