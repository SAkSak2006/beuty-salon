const { execute, queryOne } = require('../config/database');

/**
 * Audit logging middleware factory
 * Logs create/update/delete actions with old_data for updates/deletes
 */
function auditLog(entityType) {
  return async (req, res, next) => {
    // Only intercept mutating operations
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Capture old_data BEFORE the operation for update/delete
    let oldData = null;
    if ((req.method === 'PUT' || req.method === 'DELETE') && req.params.id) {
      try {
        // Derive table name from entityType
        const tableMap = {
          service_category: 'service_categories',
          service: 'services',
          employee: 'employees',
          client: 'clients',
          appointment: 'appointments',
          payment: 'payments',
          inventory: 'inventory',
          schedule: 'schedule',
          competency: 'competency_matrix',
          vacation: 'vacations',
          price_history: 'price_history',
          supplier: 'suppliers',
          inventory_category: 'inventory_categories',
          inventory_transaction: 'inventory_transactions',
          purchase_order: 'purchase_orders',
          service_material: 'service_materials',
        };
        const tableName = tableMap[entityType];
        if (tableName) {
          oldData = await queryOne(`SELECT * FROM ${tableName} WHERE id = $1`, [Number(req.params.id)]);
        }
      } catch (err) {
        console.error('Audit pre-fetch error:', err.message);
      }
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log if operation succeeded
      if (res.statusCode < 400) {
        const action = req.method === 'POST' ? 'create'
          : req.method === 'PUT' ? 'update'
          : 'delete';

        const userId = req.user ? req.user.id : null;
        const entityId = req.params.id ? parseInt(req.params.id) : (data && data.id) || null;

        const newData = req.method === 'DELETE' ? null : req.body;

        execute(
          `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            action,
            entityType,
            entityId,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            req.ip
          ]
        ).catch(err => console.error('Audit log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = auditLog;
