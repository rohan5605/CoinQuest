const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.find({})
      .sort({ totalVolume: -1 })
      .limit(50)
      .select('address totalSwaps totalVolume balances lastActive');

    const PRICES = {
      BTC: 62000, ETH: 3000, SUI: 1.2, BNB: 300,
      SOL: 90, ARB: 1.1, USDT: 1, USDC: 1
    };

    const leaderboard = wallets.map((w, i) => {
      const totalUSD = Object.entries(w.balances).reduce((sum, [coin, bal]) => {
        return sum + (bal * (PRICES[coin] || 0));
      }, 0);

      return {
        rank: i + 1,
        address: w.address,
        shortAddress: w.address.slice(0, 6) + '...' + w.address.slice(-4),
        totalSwaps: w.totalSwaps,
        totalVolume: w.totalVolume,
        portfolioValue: parseFloat(totalUSD.toFixed(2)),
        lastActive: w.lastActive
      };
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
