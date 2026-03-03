const createCrudRouter = require('./crud-factory');

const router = createCrudRouter('schedule', {
  beforeCreate(data) {
    if (data.isWorkingDay !== undefined) data.isWorkingDay = data.isWorkingDay ? 1 : 0;
    return data;
  },
  afterGet(row) {
    row.isWorkingDay = !!row.isWorkingDay;
    return row;
  }
});

module.exports = router;
