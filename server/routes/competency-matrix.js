const createCrudRouter = require('./crud-factory');

module.exports = createCrudRouter('competency_matrix', {
  beforeCreate(data) {
    if (data.canPerform !== undefined) data.canPerform = data.canPerform ? 1 : 0;
    return data;
  },
  afterGet(row) {
    row.canPerform = !!row.canPerform;
    return row;
  }
});
