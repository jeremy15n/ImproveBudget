import db from './database.service.js';

export const accountService = {
  // Now accepts a specific date (from the client)
  async syncBalancesFromInvestments(clientDate) {
    // --- STEP 1: Update Accounts from Investments ---
    const query = `
      SELECT account_id, SUM(current_value) as total_value 
      FROM investments 
      WHERE account_id IS NOT NULL 
      GROUP BY account_id
    `;
    
    // Check if we need to use query or prepare based on DB adapter
    const totals = db.query ? db.query(query) : (db.prepare ? db.prepare(query).all() : []);
    
    let updates = 0;
    
    // Helper to run updates safely
    const updateAccount = (id, balance) => {
      const updateQuery = 'UPDATE accounts SET balance = ?, last_synced = datetime("now"), updated_at = datetime("now") WHERE id = ?';
      if (db.run) {
        db.run(updateQuery, [balance, id]);
      } else if (db.prepare) {
        db.prepare(updateQuery).run(balance, id);
      }
    };

    if (totals && totals.length > 0) {
      for (const { account_id, total_value } of totals) {
        if (total_value !== null) {
           updateAccount(account_id, total_value);
           updates++;
        }
      }
    }
    
    // --- STEP 2: Take Net Worth Snapshot ---
    // Pass the clientDate to the snapshot function
    await this.takeSnapshot(clientDate);
    
    return { success: true, accounts_updated: updates, snapshot_taken: true };
  },

  // Now accepts a targetDate
  async takeSnapshot(targetDate) {
    try {
      const accounts = db.list('Account');
      
      const isTrue = (val) => val === 1 || val === true || val === "true";
      const isFalse = (val) => val === 0 || val === false || val === "false";

      const assets = accounts.filter(a => isTrue(a.is_asset) && !isFalse(a.is_active));
      const liabilities = accounts.filter(a => isFalse(a.is_asset) && !isFalse(a.is_active));

      const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
      const totalLiabilities = liabilities.reduce((s, a) => s + (a.balance || 0), 0);
      const netWorth = totalAssets - totalLiabilities;

      // USE CLIENT DATE if provided, otherwise default to server time
      // This fixes the "Tomorrow" bug
      const today = targetDate || new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7); // YYYY-MM

      const snapshotData = {
        date: today,
        month: month,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
        accounts_breakdown: JSON.stringify(accounts.filter(a => !isFalse(a.is_active)).map(a => ({
          account_id: a.id,
          name: a.name,
          balance: a.balance || 0
        })))
      };

      const existing = db.list('NetWorthSnapshot', { date: today });
      
      if (existing && existing.length > 0) {
        db.update('NetWorthSnapshot', existing[0].id, snapshotData);
        console.log(`Updated snapshot for ${today}`);
      } else {
        db.create('NetWorthSnapshot', snapshotData);
        console.log(`Created snapshot for ${today}`);
      }
    } catch (error) {
      console.error("Failed to take snapshot during sync:", error);
    }
  }
};