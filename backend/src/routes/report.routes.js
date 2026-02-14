import express from 'express';
import reportService from '../services/report.service.js';

const router = express.Router();

/**
 * GET /api/reports/cash-flow
 * Query params:
 *   startDate - Start date YYYY-MM-DD (e.g., 2025-01-01)
 *   endDate   - End date YYYY-MM-DD (e.g., 2025-12-31)
 *   interval  - 'month' (default) or 'year'
 */
router.get('/cash-flow', (req, res, next) => {
  try {
    const { startDate, endDate, interval } = req.query;
    const data = reportService.getCashFlow({ startDate, endDate, interval });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/years
 * Returns available years that have transaction data
 */
router.get('/years', (req, res, next) => {
  try {
    const years = reportService.getAvailableYears();
    res.json(years);
  } catch (error) {
    next(error);
  }
});

export default router;
