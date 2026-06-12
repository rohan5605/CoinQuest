const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');

// Create custom coin
router.post('/create', async (req, res) => {
  try {
    const { address, name, symbol, supply, decimals = 18 } = req.body;

    if (!address || !name || !symbol || !supply) {
      return res.status(400).json({ error: 'All fields required: address, name, symbol, supply' });
    }

    if (symbol.length > 10) return res.status(400).json({ error: 'Symbol max 10 characters' });
    if (name.length > 50) return res.status(400).json({ error: 'Name max 50 characters' });

    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // Check if coin already exists for this wallet
    const existing = wallet.customCoins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    if (existing) return res.status(400).json({ error: 'You already created a coin with this symbol' });

    wallet.customCoins.push({
      symbol: symbol.toUpperCase(),
      name,
      supply: parseFloat(supply),
      balance: parseFloat(supply),
      decimals: parseInt(decimals)
    });

    await wallet.save();

    res.json({
      success: true,
      coin: wallet.customCoins[wallet.customCoins.length - 1],
      message: `${name} (${symbol.toUpperCase()}) created successfully!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all custom coins for wallet
router.get('/:address', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ success: true, customCoins: wallet.customCoins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
