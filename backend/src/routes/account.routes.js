import express from 'express';
import { accountService } from '../services/account.service.js';

const router = express.Router();

// POST /api/accounts/sync-balances
router.post('/sync-balances', async (req, res) => {
  try {
    // Pass the date from the request body (sent by frontend)
    const result = await accountService.syncBalancesFromInvestments(req.body.date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;