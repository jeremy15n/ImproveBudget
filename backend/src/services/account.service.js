import db from './database.service.js';

export const accountService = {
  // Recalculate account balances based on investment holdings
  async syncBalancesFromInvestments() {
    // 1. Get total value grouped by account
    // uses db.query if available (wrapper) or db.prepare (direct better-sqlite3)
    const query = `
      SELECT account_id, SUM(current_value) as total_value 
      FROM investments 
      WHERE account_id IS NOT NULL 
      GROUP BY account_id
    `;
    
    const totals = db.query ? db.query(query) : db.prepare(query).all();
    
    let updates = 0;
    
    // 2. Update the accounts table
    // We wrap this in a transaction if possible, otherwise just loop
    const updateQuery = 'UPDATE accounts SET balance = ?, updated_at = datetime("now") WHERE id = ?';
    
    const runUpdate = db.run ? db.run.bind(db) : (db.prepare ? db.prepare(updateQuery).run.bind(db.prepare(updateQuery)) : null);

    if (!runUpdate) {
      throw new Error("Database adapter does not support updates");
    }

    for (const { account_id, total_value } of totals) {
      // safety check to ensure we don't set null balances
      if (total_value !== null) {
         if (db.run) {
             db.run(updateQuery, [total_value, account_id]);
         } else {
             runUpdate(total_value, account_id);
         }
         updates++;
      }
    }
    
    return { success: true, accounts_updated: updates };
  }
};