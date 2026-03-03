const express = require('express');
const { queryAll, queryOne, execute } = require('../database');

/**
 * Creates a standard CRUD router for a given table.
 * @param {string} table - SQLite table name
 * @param {object} options - Optional config
 * @param {Function} options.beforeCreate - Transform data before insert
 * @param {Function} options.afterGet - Transform rows after select
 */
function createCrudRouter(table, options = {}) {
  const router = express.Router();

  // GET all
  router.get('/', (req, res) => {
    try {
      let rows = queryAll(`SELECT * FROM ${table}`);
      if (options.afterGet) rows = rows.map(options.afterGet);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get('/:id', (req, res) => {
    try {
      let row = queryOne(`SELECT * FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (options.afterGet) row = options.afterGet(row);
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', (req, res) => {
    try {
      let data = { ...req.body };
      delete data.id;
      if (options.beforeCreate) data = options.beforeCreate(data);

      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col] === undefined ? null : data[col]);

      const result = execute(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      let newRow = queryOne(`SELECT * FROM ${table} WHERE id = ?`, [result.lastInsertRowid]);
      if (options.afterGet) newRow = options.afterGet(newRow);
      res.status(201).json(newRow);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', (req, res) => {
    try {
      let data = { ...req.body };
      delete data.id;
      if (options.beforeCreate) data = options.beforeCreate(data);

      const columns = Object.keys(data);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = [...columns.map(col => data[col] === undefined ? null : data[col]), Number(req.params.id)];

      execute(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);

      let row = queryOne(`SELECT * FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (options.afterGet) row = options.afterGet(row);
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', (req, res) => {
    try {
      const result = execute(`DELETE FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
