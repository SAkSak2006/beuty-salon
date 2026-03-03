const express = require('express');
const { queryAll, queryOne, execute } = require('../config/database');

/**
 * Creates a standard CRUD router for a given table (PostgreSQL version).
 * @param {string} table - PostgreSQL table name
 * @param {object} options - Optional config
 * @param {Function} options.beforeCreate - Transform data before insert/update
 * @param {Function} options.afterGet - Transform rows after select
 * @param {string[]} options.writeRoles - Roles allowed to POST/PUT/DELETE (default: all authenticated)
 * @param {Function} options.filterByRole - (req) => { column, value } for role-based row filtering
 * @param {Function} options.afterWrite - async () => {} called after POST/PUT/DELETE (e.g. for cache invalidation)
 */
function createCrudRouter(table, options = {}) {
  const router = express.Router();

  /**
   * Middleware: check write permissions for CUD operations
   */
  function checkWriteAccess(req, res, next) {
    if (options.writeRoles && options.writeRoles.length > 0) {
      if (!req.user || !options.writeRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Недостаточно прав для изменения данных' });
      }
    }
    next();
  }

  /**
   * Get role filter: returns { column, value } or null
   */
  function getRoleFilter(req) {
    if (options.filterByRole) {
      return options.filterByRole(req); // returns { column: '"employeeId"', value: 123 } or null
    }
    return null;
  }

  // GET all
  router.get('/', async (req, res) => {
    try {
      const filter = getRoleFilter(req);
      let sql, params;

      if (filter) {
        sql = `SELECT * FROM ${table} WHERE ${filter.column} = $1`;
        params = [filter.value];
      } else {
        sql = `SELECT * FROM ${table}`;
        params = [];
      }

      let rows = await queryAll(sql, params);
      if (options.afterGet) rows = rows.map(options.afterGet);
      res.json(rows);
    } catch (err) {
      console.error(`GET /${table} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get('/:id', async (req, res) => {
    try {
      const filter = getRoleFilter(req);
      let sql, params;

      if (filter) {
        sql = `SELECT * FROM ${table} WHERE id = $1 AND ${filter.column} = $2`;
        params = [Number(req.params.id), filter.value];
      } else {
        sql = `SELECT * FROM ${table} WHERE id = $1`;
        params = [Number(req.params.id)];
      }

      let row = await queryOne(sql, params);
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (options.afterGet) row = options.afterGet(row);
      res.json(row);
    } catch (err) {
      console.error(`GET /${table}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', checkWriteAccess, async (req, res) => {
    try {
      let data = { ...req.body };
      delete data.id;
      if (options.beforeCreate) data = options.beforeCreate(data);

      const columns = Object.keys(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const quotedColumns = columns.map(col => `"${col}"`).join(', ');
      const values = columns.map(col => data[col] === undefined ? null : data[col]);

      const result = await execute(
        `INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders}) RETURNING id`,
        values
      );

      const newId = result.rows[0].id;
      let newRow = await queryOne(`SELECT * FROM ${table} WHERE id = $1`, [newId]);
      if (options.afterGet) newRow = options.afterGet(newRow);
      if (options.afterWrite) await options.afterWrite().catch(() => {});
      res.status(201).json(newRow);
    } catch (err) {
      console.error(`POST /${table} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', checkWriteAccess, async (req, res) => {
    try {
      let data = { ...req.body };
      delete data.id;
      if (options.beforeCreate) data = options.beforeCreate(data);

      const columns = Object.keys(data);
      const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
      const values = [...columns.map(col => data[col] === undefined ? null : data[col]), Number(req.params.id)];

      await execute(
        `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1}`,
        values
      );

      let row = await queryOne(`SELECT * FROM ${table} WHERE id = $1`, [Number(req.params.id)]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (options.afterGet) row = options.afterGet(row);
      if (options.afterWrite) await options.afterWrite().catch(() => {});
      res.json(row);
    } catch (err) {
      console.error(`PUT /${table}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', checkWriteAccess, async (req, res) => {
    try {
      const result = await execute(`DELETE FROM ${table} WHERE id = $1`, [Number(req.params.id)]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      if (options.afterWrite) await options.afterWrite().catch(() => {});
      res.json({ success: true });
    } catch (err) {
      console.error(`DELETE /${table}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
