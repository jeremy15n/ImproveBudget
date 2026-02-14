import { getDb } from '../config/database.js';

/**
 * Generic database service for CRUD operations
 * Works with all entity types in a consistent manner
 */
export class DatabaseService {
  get db() {
    return getDb();
  }

  /**
   * List records with optional filtering, sorting, and limiting
   * @param {string} table - Table name
   * @param {object} filters - Filter conditions (key-value pairs for equality, or key_gte/key_lte/key_like for operators)
   * @param {object} sort - Sort options {sort_by, sort_order}
   * @param {number} limit - Maximum records to return
   * @returns {array} Array of records
   */
  list(table, filters = {}, sort = {}, limit = null) {
    try {
      const dbInstance = this.db;
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }

      let query = `SELECT * FROM ${this.escapeTableName(table)}`;
      const params = [];

      // Build WHERE clause
      const whereClause = this.buildWhereClause(filters, params);
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      // Add sorting
      if (sort.sort_by) {
        const orderDir = sort.sort_order === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${this.escapeColumnName(sort.sort_by)} ${orderDir}`;
      }

      // Add limit
      if (limit) {
        query += ` LIMIT ${parseInt(limit)}`;
      }

      const stmt = dbInstance.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      throw new Error(`Failed to list ${table}: ${error.message}`);
    }
  }

  /**
   * Get a single record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {object} Single record or null
   */
  getById(table, id) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${this.escapeTableName(table)} WHERE id = ?`);
      return stmt.get(id);
    } catch (error) {
      throw new Error(`Failed to get ${table} by id: ${error.message}`);
    }
  }

  /**
   * Create a single record
   * @param {string} table - Table name
   * @param {object} data - Record data
   * @returns {object} Created record with ID
   */
  create(table, data) {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data);

      const query = `
        INSERT INTO ${this.escapeTableName(table)} (${columns.map(c => this.escapeColumnName(c)).join(', ')})
        VALUES (${placeholders})
      `;

      const stmt = this.db.prepare(query);
      const result = stmt.run(...values);

      return {
        id: result.lastInsertRowid,
        ...data
      };
    } catch (error) {
      throw new Error(`Failed to create ${table}: ${error.message}`);
    }
  }

  /**
   * Create multiple records in a transaction
   * @param {string} table - Table name
   * @param {array} items - Array of record data
   * @returns {object} {created: count, ids: []}
   */
  bulkCreate(table, items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { created: 0, ids: [] };
    }

    try {
      const ids = [];
      const insertStmt = this.db.transaction(() => {
        for (const item of items) {
          const result = this.create(table, item);
          ids.push(result.id);
        }
      });

      insertStmt();

      return {
        created: items.length,
        ids
      };
    } catch (error) {
      throw new Error(`Failed to bulk create in ${table}: ${error.message}`);
    }
  }

  /**
   * Update a record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @param {object} data - Fields to update
   * @returns {object} Updated record
   */
  update(table, id, data) {
    try {
      const columns = Object.keys(data);
      const setClause = columns.map(c => `${this.escapeColumnName(c)} = ?`).join(', ');
      const values = Object.values(data);

      // Update updated_at timestamp if table has it
      const hasTimestamp = this.hasColumn(table, 'updated_at');
      let query = `
        UPDATE ${this.escapeTableName(table)}
        SET ${setClause}${hasTimestamp ? ', updated_at = datetime("now")' : ''}
        WHERE id = ?
      `;

      const stmt = this.db.prepare(query);
      stmt.run(...values, id);

      // Return updated record
      return this.getById(table, id);
    } catch (error) {
      throw new Error(`Failed to update ${table}: ${error.message}`);
    }
  }

  /**
   * Update multiple records by IDs
   */
  bulkUpdate(table, ids, data) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { updated: 0 };
    }

    try {
      const columns = Object.keys(data);
      const setClause = columns.map(c => `${this.escapeColumnName(c)} = ?`).join(', ');
      const values = Object.values(data);

      const hasTimestamp = this.hasColumn(table, 'updated_at');
      const placeholders = ids.map(() => '?').join(', ');
      const query = `
        UPDATE ${this.escapeTableName(table)}
        SET ${setClause}${hasTimestamp ? ', updated_at = datetime("now")' : ''}
        WHERE id IN (${placeholders})
      `;

      const stmt = this.db.prepare(query);
      stmt.run(...values, ...ids);

      return { updated: ids.length };
    } catch (error) {
      throw new Error(`Failed to bulk update ${table}: ${error.message}`);
    }
  }

  /**
   * Delete multiple records by IDs
   */
  bulkDelete(table, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deleted: 0 };
    }

    try {
      const placeholders = ids.map(() => '?').join(', ');
      const stmt = this.db.prepare(`DELETE FROM ${this.escapeTableName(table)} WHERE id IN (${placeholders})`);
      stmt.run(...ids);
      return { deleted: ids.length };
    } catch (error) {
      throw new Error(`Failed to bulk delete from ${table}: ${error.message}`);
    }
  }

  /**
   * Delete a record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {boolean} Success
   */
  delete(table, id) {
    try {
      const stmt = this.db.prepare(`DELETE FROM ${this.escapeTableName(table)} WHERE id = ?`);
      stmt.run(id);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete from ${table}: ${error.message}`);
    }
  }

  /**
   * Build WHERE clause from filters
   * Supports: equality (key=value), comparisons (key_gte, key_lte, key_like)
   * @param {object} filters - Filter conditions
   * @param {array} params - Parameters array to populate
   * @returns {string} WHERE clause
   */
  buildWhereClause(filters, params = []) {
    const conditions = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Handle different filter types
      if (key.endsWith('_gte')) {
        const field = key.slice(0, -4); // Remove '_gte'
        conditions.push(`${this.escapeColumnName(field)} >= ?`);
        params.push(value);
      } else if (key.endsWith('_lte')) {
        const field = key.slice(0, -4); // Remove '_lte'
        conditions.push(`${this.escapeColumnName(field)} <= ?`);
        params.push(value);
      } else if (key.endsWith('_like')) {
        const field = key.slice(0, -5); // Remove '_like'
        conditions.push(`${this.escapeColumnName(field)} LIKE ?`);
        params.push(`%${value}%`);
      } else {
        // Exact match
        conditions.push(`${this.escapeColumnName(key)} = ?`);
        params.push(value);
      }
    }

    return conditions.join(' AND ');
  }

  /**
   * Escape table name for SQL
   * @param {string} table - Table name
   * @returns {string} Escaped table name
   */
  escapeTableName(table) {
    // Map entity names to table names (singular to plural)
    const tableMap = {
      'transaction': 'transactions',
      'account': 'accounts',
      'budget': 'budgets',
      'categoryrule': 'categoryrules',
      'category': 'categories',
      'financialgoal': 'financialgoals',
      'investment': 'investments',
      'networthsnapshot': 'networthsnapshots'
    };

    const tableName = tableMap[table.toLowerCase()] || table.toLowerCase();
    return `\`${tableName}\``;
  }

  /**
   * Escape column name for SQL
   * @param {string} column - Column name
   * @returns {string} Escaped column name
   */
  escapeColumnName(column) {
    return `\`${column}\``;
  }

  /**
   * Check if a column exists in a table
   * @param {string} table - Table name
   * @param {string} column - Column name
   * @returns {boolean} True if column exists
   */
  hasColumn(table, column) {
    try {
      const stmt = this.db.prepare(`PRAGMA table_info(${this.escapeTableName(table)})`);
      const columns = stmt.all();
      return columns.some(c => c.name === column);
    } catch {
      return false;
    }
  }

  /**
   * Execute raw SQL
   * @param {string} sql - SQL query
   * @param {array} params - Parameters
   * @returns {any} Query result
   */
  raw(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }
}

export default new DatabaseService();
