const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const { v4: uuidv4 } = require('uuid');

// Fake exchange rates (USD base)
const PRICES = {
  BTC: 62000,
  ETH: 3000,
  SUI: 1.2,
  BNB: 300,
  SOL: 90,
  ARB: 1.1,
  USDT: 1,
  USDC: 1
};

// Get current prices
router.get('/prices', (req, res) => {
  // Add slight random variation to prices
  const livePrices = {};
  Object.keys(PRICES).forEach(coin => {
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    livePrices[coin] = PRICES[coin] * (1 + variation);
  });
  res.json({ success: true, prices: livePrices });
});

// Get swap quote
router.post('/quote', async (req, res) => {
  try {
    const { fromCoin, toCoin, fromAmount } = req.body;

    if (!PRICES[fromCoin] || !PRICES[toCoin]) {
      return res.status(400).json({ error: 'Invalid coin pair' });
    }

    const fromUSD = parseFloat(fromAmount) * PRICES[fromCoin];
    const fee = fromUSD * 0.003; // 0.3% fee
    const toAmount = (fromUSD - fee) / PRICES[toCoin];
    const rate = PRICES[fromCoin] / PRICES[toCoin];
    const priceImpact = Math.min((parseFloat(fromAmount) * PRICES[fromCoin] / 1000000) * 0.1, 5);

    res.json({
      success: true,
      quote: {
        fromCoin,
        toCoin,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount.toFixed(8)),
        rate: parseFloat(rate.toFixed(8)),
        fee: parseFloat(fee.toFixed(6)),
        priceImpact: parseFloat(priceImpact.toFixed(2)),
        minimumReceived: parseFloat((toAmount * 0.995).toFixed(8)),
        slippage: 0.5
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate swap (creates pending tx)
router.post('/initiate', async (req, res) => {
  try {
    const { address, fromCoin, toCoin, fromAmount, toAmount } = req.body;

    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (wallet.balances[fromCoin] < parseFloat(fromAmount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const txHash = '0x' + uuidv4().replace(/-/g, '');
    wallet.transactions.push({
      type: 'swap',
      fromCoin,
      toCoin,
      fromAmount: parseFloat(fromAmount),
      toAmount: parseFloat(toAmount),
      status: 'pending',
      txHash
    });

    await wallet.save();

    res.json({
      success: true,
      txHash,
      message: 'Transaction initiated - approve in CoinQuestWallet',
      transaction: {
        txHash,
        fromCoin,
        toCoin,
        fromAmount,
        toAmount,
        status: 'pending'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct swap (auto approve)
router.post('/execute', async (req, res) => {
  try {
    const { address, fromCoin, toCoin, fromAmount, toAmount } = req.body;

    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (wallet.balances[fromCoin] < parseFloat(fromAmount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    wallet.balances[fromCoin] -= parseFloat(fromAmount);
    wallet.balances[toCoin] = (wallet.balances[toCoin] || 0) + parseFloat(toAmount);
    wallet.totalSwaps += 1;
    wallet.totalVolume += parseFloat(fromAmount) * PRICES[fromCoin];

    const txHash = '0x' + uuidv4().replace(/-/g, '');
    wallet.transactions.push({
      type: 'swap',
      fromCoin,
      toCoin,
      fromAmount: parseFloat(fromAmount),
      toAmount: parseFloat(toAmount),
      status: 'approved',
      txHash
    });

    await wallet.save();

    res.json({
      success: true,
      txHash,
      balances: wallet.balances,
      message: `Swapped ${fromAmount} ${fromCoin} for ${toAmount} ${toCoin}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
