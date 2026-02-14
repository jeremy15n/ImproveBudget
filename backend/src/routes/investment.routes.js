import express from 'express';
import { marketDataService } from '../services/marketData.service.js';

const router = express.Router();

// POST /api/investments/refresh - Update all database prices
router.post('/refresh', async (req, res) => {
  try {
    const result = await marketDataService.refreshAllPrices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investments/quote/:symbol - Get live data for the "Add Holding" form
router.get('/quote/:symbol', async (req, res) => {
  try {
    const data = await marketDataService.getQuote(req.params.symbol);
    if (!data) return res.status(404).json({ error: "Symbol not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
