const mongoose = require('mongoose');

const DEFAULT_BALANCES = {
  BTC: 0.5,
  ETH: 5.0,
  SUI: 1000,
  BNB: 10,
  SOL: 50,
  ARB: 500,
  USDT: 1000,
  USDC: 1000
};

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['swap', 'add', 'send', 'receive'], required: true },
  fromCoin: String,
  toCoin: String,
  fromAmount: Number,
  toAmount: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  txHash: String,
  timestamp: { type: Date, default: Date.now }
});

const walletSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true },
  balances: {
    BTC: { type: Number, default: 0.5 },
    ETH: { type: Number, default: 5.0 },
    SUI: { type: Number, default: 1000 },
    BNB: { type: Number, default: 10 },
    SOL: { type: Number, default: 50 },
    ARB: { type: Number, default: 500 },
    USDT: { type: Number, default: 1000 },
    USDC: { type: Number, default: 1000 }
  },
  customCoins: [{
    symbol: String,
    name: String,
    supply: Number,
    balance: Number,
    decimals: { type: Number, default: 18 },
    createdAt: { type: Date, default: Date.now }
  }],
  transactions: { type: [transactionSchema], default: [] },
  totalSwaps: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

walletSchema.methods.getRecentTransactions = function(limit = 10) {
  return this.transactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

module.exports = mongoose.model('Wallet', walletSchema);
