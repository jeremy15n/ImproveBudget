import YahooFinance from 'yahoo-finance2';
import db from './database.service.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const marketDataService = {
  // Fetch a single quote (price, name, etc.)
  async getQuote(symbol) {
    try {
      // The invalid 'validateResult' option has been removed.
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote) return null;
      
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        price: quote.regularMarketPrice,
        currency: quote.currency,
        change_pct: quote.regularMarketChangePercent || 0
      };
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error.message);
      return null;
    }
  },

  // Update all investments in the DB with fresh prices
  async refreshAllPrices() {
    // Use the DatabaseService's list method. It maps 'investment' to the 'investments' table.
    const investments = db.list('investment'); 
    
    let updates = 0;
    let errors = 0;
    
    for (const inv of investments) {
      if (!inv.symbol) continue;
      
      const quote = await this.getQuote(inv.symbol);
      
      if (quote && quote.price) {
        const currentPrice = quote.price;
        const currentValue = currentPrice * inv.shares;
        const gainLoss = currentValue - inv.cost_basis;
        const gainLossPct = inv.cost_basis > 0 ? (gainLoss / inv.cost_basis) * 100 : 0;
        
        try {
          // Use the 'update' method from the DatabaseService.
          // The service handles 'updated_at' automatically, but we need to set 'last_updated'.
          db.update('investment', inv.id, {
            current_price: currentPrice,
            current_value: currentValue,
            gain_loss: gainLoss,
            gain_loss_pct: gainLossPct,
            last_updated: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
          
          updates++;
        } catch (e) {
          console.error(`DB Update failed for ${inv.symbol}`, e);
          errors++;
        }
      } else {
        console.warn(`Could not get a valid quote for symbol: ${inv.symbol}`);
        errors++;
      }
    }
    return { success: true, updated: updates, failed: errors };
  }
};
