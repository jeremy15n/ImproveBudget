import express from 'express';
import { accountService } from '../services/account.service.js';

const router = express.Router();

// POST /api/accounts/sync-balances - Recalculate account balances from investments
router.post('/sync-balances', async (req, res) => {
  try {
    const result = await accountService.syncBalancesFromInvestments();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
