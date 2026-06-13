# ⬡ CoinQuest — Fake Crypto Swap Platform

> **College Project** | MERN Stack | Fake DeFi Platform with Chrome Extension Wallet

---

## 🗂️ Project Structure

```
coinquest/
├── backend/                    ← Node.js + Express + MongoDB
│   ├── models/
│   │   ├── Wallet.js           ← Wallet & transaction schema
│   │   └── LiquidityPool.js    ← Liquidity pool schema
│   ├── routes/
│   │   ├── walletRoutes.js     ← Connect, balances, add funds
│   │   ├── swapRoutes.js       ← Prices, quotes, swap execution
│   │   ├── leaderboardRoutes.js← Top traders ranking
│   │   ├── coinRoutes.js       ← Custom token creation
│   │   └── liquidityRoutes.js  ← Pool management
│   ├── server.js               ← Express app entry point
│   ├── .env                    ← Environment variables
│   └── package.json
│
├── frontend/                   ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Navbar.css
│   │   │   └── PendingTxModal.jsx   ← Approve/Reject popup
│   │   │       PendingTxModal.css
│   │   ├── context/
│   │   │   └── WalletContext.jsx    ← Global state (wallet, balances)
│   │   ├── pages/
│   │   │   ├── ConnectPage.jsx      ← Landing / wallet connect
│   │   │   ├── SwapPage.jsx         ← Main swap interface
│   │   │   ├── WalletPage.jsx       ← Balances + add funds
│   │   │   ├── LeaderboardPage.jsx  ← Top traders
│   │   │   ├── LiquidityPage.jsx    ← Liquidity pools
│   │   │   └── CreateCoinPage.jsx   ← Custom token creation
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               ← Global theme (orange + white)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── extension/                  ← CoinQuestWallet Chrome Extension
    ├── manifest.json           ← Extension config (Manifest V3)
    ├── background/
    │   └── background.js       ← Service worker, notifications
    ├── popup/
    │   ├── popup.html          ← Extension UI
    │   ├── popup.css           ← MetaMask-style styling
    │   └── popup.js            ← Wallet logic, API calls
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## ⚙️ Requirements — Install These First

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ | https://nodejs.org |
| **MongoDB** | v6+ (Community) | https://www.mongodb.com/try/download/community |
| **npm** | v9+ (comes with Node) | — |
| **Google Chrome** | Any recent version | https://www.google.com/chrome |
| **VS Code** | Optional but recommended | https://code.visualstudio.com |

---

## 🚀 How to Run — Step by Step

### Step 1 — Start MongoDB

**Windows:**
```
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```
**Mac/Linux:**
```bash
brew services start mongodb-community
# OR
sudo systemctl start mongod
```

---

### Step 2 — Start Backend

```bash
cd coinquest/backend
npm install
npm run dev
```

✅ You should see:
```
✅ MongoDB Connected
🚀 CoinQuest Server running on port 5000
```

---

### Step 3 — Start Frontend

Open a **new terminal tab**:

```bash
cd coinquest/frontend
npm install
npm run dev
```

✅ Open browser at: **http://localhost:3000**

---

### Step 4 — Load Chrome Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `coinquest/extension/` folder
5. **CoinQuestWallet** icon appears in toolbar ✅

---

## 🌐 Website Pages

| Page | URL | Description |
|------|-----|-------------|
| Connect | `/` | Wallet address login |
| Swap | `/swap` | Swap 8 crypto coins |
| Wallet | `/wallet` | Balances + add funds |
| Leaderboard | `/leaderboard` | Top traders ranking |
| Liquidity | `/liquidity` | Add/remove liquidity |
| Create Coin | `/create` | Create custom tokens |

---

## 🔌 API Endpoints

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallet/connect` | Connect/create wallet |
| GET | `/api/wallet/:address` | Get wallet data |
| GET | `/api/wallet/:address/balances` | Get token balances |
| POST | `/api/wallet/:address/add-balance` | Add balance manually |
| GET | `/api/wallet/:address/transactions` | Recent transactions |
| PATCH | `/api/wallet/:address/transaction/:txHash` | Approve or reject tx |

### Swap
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swap/prices` | Live fake prices |
| POST | `/api/swap/quote` | Get swap quote |
| POST | `/api/swap/initiate` | Create pending tx (extension) |
| POST | `/api/swap/execute` | Direct swap (auto approve) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Top 50 traders |
| POST | `/api/coins/create` | Create custom token |
| GET | `/api/coins/:address` | Get user's custom coins |
| GET | `/api/liquidity` | All liquidity pools |
| POST | `/api/liquidity/add` | Add liquidity |
| POST | `/api/liquidity/remove` | Remove liquidity |

---

## 💰 Supported Coins

| Symbol | Name | Default Balance |
|--------|------|----------------|
| BTC | Bitcoin | 0.5 |
| ETH | Ethereum | 5.0 |
| SUI | Sui | 1,000 |
| BNB | BNB | 10 |
| SOL | Solana | 50 |
| ARB | Arbitrum | 500 |
| USDT | Tether | 1,000 |
| USDC | USD Coin | 1,000 |

---

## 🧩 Extension Features

- ✅ View all coin balances (synced from website)
- ✅ Approve / Reject transactions
- ✅ Auto-refresh every 15 seconds
- ✅ Badge notification for pending txs
- ✅ Transaction history
- ✅ Portfolio total value
- ✅ Same wallet address as website

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | CSS Variables, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Extension | Chrome Manifest V3, Vanilla JS |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Fonts | Orbitron, Space Grotesk |

---

## ⚠️ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `MongoDB connection failed` | Start MongoDB service first |
| `Cannot reach backend` | Run `npm run dev` in `/backend` |
| `CORS error` | Make sure backend is on port 5000 |
| Extension not showing | Reload extension in `chrome://extensions` |
| `npm install` fails | Delete `node_modules` and try again |

---

## 📝 Notes

- This is a **fake/demo** project for educational purposes
- No real crypto or real money is involved
- All balances and transactions are stored in MongoDB locally
- The extension connects to `localhost:5000` (your local backend)

---

**College Project | CoinQuest MERN Stack**
