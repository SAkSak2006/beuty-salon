const createCrudRouter = require('./crud-factory');

const jsonFields = ['requiredMaterials'];

module.exports = createCrudRouter('services', {
  beforeCreate(data) {
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] !== 'string') {
        data[field] = JSON.stringify(data[field]);
      }
    });
    if (data.isActive !== undefined) data.isActive = data.isActive ? 1 : 0;
    return data;
  },
  afterGet(row) {
    jsonFields.forEach(field => {
      if (row[field]) {
        try { row[field] = JSON.parse(row[field]); } catch { row[field] = []; }
      } else {
        row[field] = [];
      }
    });
    row.isActive = !!row.isActive;
    return row;
  }
});
