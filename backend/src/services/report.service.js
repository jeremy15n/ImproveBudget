import { getDb } from '../config/database.js';

/**
 * Report service for aggregated financial data
 * Handles queries that don't fit the generic CRUD pattern
 */
class ReportService {
  get db() {
    return getDb();
  }

  /**
   * Get cash flow data grouped by interval within a date range
   * @param {object} options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.interval - 'month' (default) or 'year'
   * @returns {array} Array of { period, label, income, expenses, savings, net }
   */
  getCashFlow({ startDate, endDate, interval = 'month' } = {}) {
    try {
      const dbInstance = this.db;
      if (!dbInstance) throw new Error('Database not initialized');

      const dateFormat = interval === 'year' ? '%Y' : '%Y-%m';
      const params = [];
      const conditions = [`\`type\` NOT IN ('transfer')`];

      if (startDate) {
        conditions.push(`\`date\` >= ?`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`\`date\` <= ?`);
        params.push(endDate);
      }

      const whereSQL = `WHERE ${conditions.join(' AND ')}`;

      const sql = `
        SELECT
          strftime('${dateFormat}', \`date\`) as period,
          SUM(CASE WHEN \`type\` != 'savings' AND \`amount\` > 0 THEN \`amount\` ELSE 0 END) as income,
          SUM(CASE WHEN \`type\` != 'savings' AND \`amount\` < 0 THEN ABS(\`amount\`) ELSE 0 END) as expenses,
          SUM(CASE WHEN \`type\` = 'savings' THEN ABS(\`amount\`) ELSE 0 END) as savings
        FROM \`transactions\`
        ${whereSQL}
        GROUP BY period
        ORDER BY period ASC
      `;

      const stmt = dbInstance.prepare(sql);
      const rows = stmt.all(...params);

      return rows.map(row => ({
        period: row.period,
        label: row.period,
        income: row.income || 0,
        expenses: row.expenses || 0,
        savings: row.savings || 0,
        net: (row.income || 0) - (row.expenses || 0) - (row.savings || 0)
      }));
    } catch (error) {
      throw new Error(`Failed to get cash flow: ${error.message}`);
    }
  }

  /**
   * Get available years that have transactions
   * @returns {array} Array of year strings, e.g., ['2024', '2025']
   */
  getAvailableYears() {
    try {
      const dbInstance = this.db;
      if (!dbInstance) throw new Error('Database not initialized');

      const sql = `SELECT DISTINCT strftime('%Y', \`date\`) as year FROM \`transactions\` ORDER BY year ASC`;
      const stmt = dbInstance.prepare(sql);
      return stmt.all().map(r => r.year);
    } catch (error) {
      throw new Error(`Failed to get available years: ${error.message}`);
    }
  }
}

export default new ReportService();
