const express = require('express');
const router = express.Router();
const LiquidityPool = require('../models/LiquidityPool');
const Wallet = require('../models/Wallet');

// Get all pools
router.get('/', async (req, res) => {
  try {
    let pools = await LiquidityPool.find({});
    if (pools.length === 0) {
      await LiquidityPool.seedPools();
      pools = await LiquidityPool.find({});
    }
    res.json({ success: true, pools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add liquidity
router.post('/add', async (req, res) => {
  try {
    const { address, pair, amount0, amount1 } = req.body;

    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const pool = await LiquidityPool.findOne({ pair });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    if (wallet.balances[pool.token0] < amount0) {
      return res.status(400).json({ error: `Insufficient ${pool.token0} balance` });
    }
    if (wallet.balances[pool.token1] < amount1) {
      return res.status(400).json({ error: `Insufficient ${pool.token1} balance` });
    }

    // Deduct from wallet
    wallet.balances[pool.token0] -= parseFloat(amount0);
    wallet.balances[pool.token1] -= parseFloat(amount1);
    await wallet.save();

    // Update pool
    pool.reserve0 += parseFloat(amount0);
    pool.reserve1 += parseFloat(amount1);
    pool.totalLiquidity += parseFloat(amount0) * 2;

    const existingProvider = pool.providers.find(p => p.address === address.toLowerCase());
    if (existingProvider) {
      existingProvider.amount0 += parseFloat(amount0);
      existingProvider.amount1 += parseFloat(amount1);
    } else {
      pool.providers.push({
        address: address.toLowerCase(),
        amount0: parseFloat(amount0),
        amount1: parseFloat(amount1),
        share: 0
      });
    }

    await pool.save();

    res.json({ success: true, message: 'Liquidity added!', pool, balances: wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove liquidity
router.post('/remove', async (req, res) => {
  try {
    const { address, pair, percentage } = req.body;

    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const pool = await LiquidityPool.findOne({ pair });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const provider = pool.providers.find(p => p.address === address.toLowerCase());
    if (!provider) return res.status(400).json({ error: 'You have no liquidity in this pool' });

    const pct = parseFloat(percentage) / 100;
    const returnAmount0 = provider.amount0 * pct;
    const returnAmount1 = provider.amount1 * pct;

    wallet.balances[pool.token0] = (wallet.balances[pool.token0] || 0) + returnAmount0;
    wallet.balances[pool.token1] = (wallet.balances[pool.token1] || 0) + returnAmount1;
    await wallet.save();

    provider.amount0 -= returnAmount0;
    provider.amount1 -= returnAmount1;
    pool.reserve0 -= returnAmount0;
    pool.reserve1 -= returnAmount1;
    await pool.save();

    res.json({ success: true, message: 'Liquidity removed!', returnAmount0, returnAmount1, balances: wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
