const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const walletRoutes = require('./routes/walletRoutes');
const swapRoutes = require('./routes/swapRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const coinRoutes = require('./routes/coinRoutes');
const liquidityRoutes = require('./routes/liquidityRoutes');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'chrome-extension://*'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/liquidity', liquidityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'CoinQuest Backend Running', timestamp: new Date() });
});

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 CoinQuest Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

module.exports = app;
