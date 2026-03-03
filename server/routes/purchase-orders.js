const createCrudRouter = require('./crud-factory');

module.exports = createCrudRouter('purchase_orders', {
  beforeCreate(data) {
    if (data.items && typeof data.items !== 'string') {
      data.items = JSON.stringify(data.items);
    }
    return data;
  },
  afterGet(row) {
    if (row.items) {
      try { row.items = JSON.parse(row.items); } catch { row.items = []; }
    } else {
      row.items = [];
    }
    return row;
  }
});
