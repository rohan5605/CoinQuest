const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const { v4: uuidv4 } = require('uuid');

// Get or create wallet by address
router.post('/connect', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Wallet address required' });

    let wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) {
      wallet = new Wallet({ address: address.toLowerCase() });
      await wallet.save();
    }
    wallet.lastActive = new Date();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wallet by address
router.get('/:address', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balances
router.get('/:address/balances', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ success: true, balances: wallet.balances, customCoins: wallet.customCoins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add balance manually
router.post('/:address/add-balance', async (req, res) => {
  try {
    const { coin, amount } = req.body;
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const validCoins = ['BTC', 'ETH', 'SUI', 'BNB', 'SOL', 'ARB', 'USDT', 'USDC'];
    if (!validCoins.includes(coin)) return res.status(400).json({ error: 'Invalid coin' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

    wallet.balances[coin] = (wallet.balances[coin] || 0) + parseFloat(amount);
    wallet.transactions.push({
      type: 'add',
      toCoin: coin,
      toAmount: parseFloat(amount),
      status: 'approved',
      txHash: '0x' + uuidv4().replace(/-/g, '')
    });
    await wallet.save();

    res.json({ success: true, balances: wallet.balances, message: `Added ${amount} ${coin}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent transactions
router.get('/:address/transactions', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    const recent = wallet.getRecentTransactions(10);
    res.json({ success: true, transactions: recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction status (approve/reject from extension)
router.patch('/:address/transaction/:txHash', async (req, res) => {
  try {
    const { status } = req.body;
    const wallet = await Wallet.findOne({ address: req.params.address.toLowerCase() });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const tx = wallet.transactions.find(t => t.txHash === req.params.txHash);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.status !== 'pending') return res.status(400).json({ error: 'Transaction already processed' });

    if (status === 'approved') {
      tx.status = 'approved';
      // Perform the actual balance change
      if (tx.type === 'swap') {
        wallet.balances[tx.fromCoin] -= tx.fromAmount;
        wallet.balances[tx.toCoin] = (wallet.balances[tx.toCoin] || 0) + tx.toAmount;
        wallet.totalSwaps += 1;
        wallet.totalVolume += tx.fromAmount;
      }
    } else if (status === 'rejected') {
      tx.status = 'rejected';
    }

    await wallet.save();
    res.json({ success: true, transaction: tx, balances: wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
