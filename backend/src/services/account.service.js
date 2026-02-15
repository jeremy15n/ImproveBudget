import db from './database.service.js';

export const accountService = {
  // Syncs investment balances AND takes a Net Worth Snapshot for history
  async syncBalancesFromInvestments() {
    // --- STEP 1: Update Accounts from Investments ---
    // We use db.raw() because standard .list() doesn't support aggregation (SUM)
    const query = `
      SELECT account_id, SUM(current_value) as total_value 
      FROM investments 
      WHERE account_id IS NOT NULL 
      GROUP BY account_id
    `;
    
    // Use the .raw() method which exists on the service instance
    const totals = db.raw(query);
    let updates = 0;
    
    // Update accounts using the service's .update() method abstraction
    for (const { account_id, total_value } of totals) {
      if (total_value !== null) {
         try {
           const now = new Date().toISOString();
           // Update the account balance and last_synced timestamp
           db.update('Account', account_id, {
             balance: total_value,
             last_synced: now
           });
           updates++;
         } catch (err) {
           console.error(`Failed to update account ${account_id}:`, err);
         }
      }
    }
    
    // --- STEP 2: Take Net Worth Snapshot (Historical Data) ---
    // This ensures every sync creates a history point for the graph
    await this.takeSnapshot();
    
    return { success: true, accounts_updated: updates, snapshot_taken: true };
  },

  // Helper to generate a snapshot record
  async takeSnapshot() {
    try {
      const accounts = db.list('Account');
      
      // SQLite boolean helper (handles 1/0 returned by DB)
      const isTrue = (val) => val === 1 || val === true || val === "true";
      const isFalse = (val) => val === 0 || val === false || val === "false";

      // Calculate Net Worth
      const assets = accounts.filter(a => isTrue(a.is_asset) && !isFalse(a.is_active));
      const liabilities = accounts.filter(a => isFalse(a.is_asset) && !isFalse(a.is_active));

      const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
      const totalLiabilities = liabilities.reduce((s, a) => s + (a.balance || 0), 0);
      const netWorth = totalAssets - totalLiabilities;

      // Date Formatting
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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

      // Upsert: If we already synced today, update the record to reflect latest numbers.
      const existing = db.list('NetWorthSnapshot', { date: today });
      
      if (existing && existing.length > 0) {
        db.update('NetWorthSnapshot', existing[0].id, snapshotData);
        console.log("Updated existing snapshot for today");
      } else {
        db.create('NetWorthSnapshot', snapshotData);
        console.log("Created new snapshot for today");
      }
    } catch (error) {
      console.error("Failed to take snapshot during sync:", error);
    }
  }
};