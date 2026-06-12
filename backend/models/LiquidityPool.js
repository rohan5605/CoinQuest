const mongoose = require('mongoose');

const liquidityPoolSchema = new mongoose.Schema({
  pair: { type: String, required: true, unique: true },
  token0: { type: String, required: true },
  token1: { type: String, required: true },
  reserve0: { type: Number, default: 0 },
  reserve1: { type: Number, default: 0 },
  totalLiquidity: { type: Number, default: 0 },
  apy: { type: Number, default: 0 },
  volume24h: { type: Number, default: 0 },
  fee: { type: Number, default: 0.3 },
  providers: [{
    address: String,
    share: Number,
    amount0: Number,
    amount1: Number,
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Seed initial pools
liquidityPoolSchema.statics.seedPools = async function() {
  const pools = [
    { pair: 'ETH/USDT', token0: 'ETH', token1: 'USDT', reserve0: 5000, reserve1: 15000000, apy: 12.5, volume24h: 2500000, totalLiquidity: 30000000 },
    { pair: 'BTC/USDT', token0: 'BTC', token1: 'USDT', reserve0: 1000, reserve1: 62000000, apy: 8.2, volume24h: 5000000, totalLiquidity: 124000000 },
    { pair: 'BNB/USDT', token0: 'BNB', token1: 'USDT', reserve0: 50000, reserve1: 15000000, apy: 15.3, volume24h: 1200000, totalLiquidity: 30000000 },
    { pair: 'SOL/USDT', token0: 'SOL', token1: 'USDT', reserve0: 100000, reserve1: 9000000, apy: 18.7, volume24h: 800000, totalLiquidity: 18000000 },
    { pair: 'ARB/USDT', token0: 'ARB', token1: 'USDT', reserve0: 5000000, reserve1: 5500000, apy: 22.1, volume24h: 600000, totalLiquidity: 11000000 },
    { pair: 'SUI/USDT', token0: 'SUI', token1: 'USDT', reserve0: 3000000, reserve1: 3600000, apy: 25.4, volume24h: 400000, totalLiquidity: 7200000 },
    { pair: 'ETH/BTC', token0: 'ETH', token1: 'BTC', reserve0: 10000, reserve1: 500, apy: 9.8, volume24h: 1800000, totalLiquidity: 60000000 },
    { pair: 'USDT/USDC', token0: 'USDT', token1: 'USDC', reserve0: 10000000, reserve1: 10000000, apy: 4.2, volume24h: 3000000, totalLiquidity: 20000000 }
  ];

  for (const pool of pools) {
    await this.findOneAndUpdate({ pair: pool.pair }, pool, { upsert: true, new: true });
  }
};

module.exports = mongoose.model('LiquidityPool', liquidityPoolSchema);
