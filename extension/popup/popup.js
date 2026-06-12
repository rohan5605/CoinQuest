const API = 'http://localhost:5000/api';

const COIN_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', SUI: '#4CA3FF',
  BNB: '#F3BA2F', SOL: '#9945FF', ARB: '#2D374B',
  USDT: '#26A17B', USDC: '#2775CA'
};
const COIN_EMOJI = {
  BTC: '₿', ETH: 'Ξ', SUI: '●', BNB: '◆',
  SOL: '◎', ARB: '◈', USDT: '₮', USDC: '$'
};
const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SUI: 'Sui',
  BNB: 'BNB', SOL: 'Solana', ARB: 'Arbitrum',
  USDT: 'Tether', USDC: 'USD Coin'
};
const PRICES = {
  BTC: 62000, ETH: 3000, SUI: 1.2, BNB: 300,
  SOL: 90, ARB: 1.1, USDT: 1, USDC: 1
};

let state = {
  address: null,
  balances: {},
  transactions: [],
  pendingTxs: [],
  customCoins: []
};

let currentTxHash = null;
let pollInterval = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
  // KEY FIX: Read address from 'cq_wallet_address' — same key website uses in localStorage
  // We store it in chrome.storage.local under the same key name for consistency
  const saved = await getStorage('cq_wallet_address');
  if (saved) {
    state.address = saved;
    await loadWallet();
    showScreen('main');
    startPolling();
  } else {
    showScreen('connect');
  }

  bindEvents();

  // Listen for messages from website (NEW_PENDING_TX signal)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'NEW_PENDING_TX') {
      // Website just created a pending tx — load wallet and switch to pending tab
      loadWallet().then(() => {
        showScreen('main');
        // Switch to pending tab automatically
        switchTab('pending');
      });
    }
    if (message.type === 'WALLET_CONNECTED' && message.address) {
      // Website connected a wallet — sync address to extension
      state.address = message.address;
      setStorage('cq_wallet_address', message.address).then(() => {
        loadWallet().then(() => showScreen('main'));
        startPolling();
      });
    }
  });
});

// ─── POLLING: refresh every 5s to catch pending txs fast ───
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    if (state.address) await loadWallet();
  }, 5000);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = null;
}

// ─── EVENTS ───
function bindEvents() {
  document.getElementById('btn-connect').addEventListener('click', handleConnect);
  document.getElementById('connect-address').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleConnect();
  });

  document.getElementById('btn-disconnect').addEventListener('click', handleDisconnect);
  document.getElementById('btn-refresh').addEventListener('click', () => loadWallet());

  document.getElementById('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(state.address);
    document.getElementById('btn-copy').textContent = '✓';
    setTimeout(() => document.getElementById('btn-copy').textContent = '⎘', 1500);
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('btn-approve-tx').addEventListener('click', handleApproveTx);
  document.getElementById('btn-reject-tx').addEventListener('click', handleRejectTx);
  document.getElementById('btn-back').addEventListener('click', () => showScreen('main'));
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  const content = document.getElementById('tab-' + tabName);
  if (content) content.classList.add('active');
}

// ─── CONNECT ───
async function handleConnect() {
  const address = document.getElementById('connect-address').value.trim().toLowerCase();
  const errEl = document.getElementById('connect-error');
  errEl.classList.add('hidden');

  if (!address || address.length < 10) {
    errEl.textContent = 'Please enter a valid wallet address.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-connect');
  btn.disabled = true;
  btn.textContent = 'Connecting...';

  try {
    const res = await fetch(`${API}/wallet/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (data.success) {
      state.address = address;
      // KEY FIX: store as 'cq_wallet_address' — same key as website localStorage
      await setStorage('cq_wallet_address', address);
      state.balances = data.wallet.balances;
      state.transactions = data.wallet.transactions || [];
      state.customCoins = data.wallet.customCoins || [];
      showScreen('main');
      renderAll();
      startPolling();
    } else {
      errEl.textContent = data.error || 'Failed to connect.';
      errEl.classList.remove('hidden');
    }
  } catch (e) {
    errEl.textContent = 'Cannot reach backend on port 5000. Make sure backend is running.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Connect Wallet';
  }
}

// ─── DISCONNECT ───
async function handleDisconnect() {
  stopPolling();
  await setStorage('cq_wallet_address', null);
  state = { address: null, balances: {}, transactions: [], pendingTxs: [], customCoins: [] };
  showScreen('connect');
  document.getElementById('connect-address').value = '';
}

// ─── LOAD WALLET — always fresh from MongoDB ───
async function loadWallet() {
  if (!state.address) return;
  try {
    const [walletRes, txRes] = await Promise.all([
      fetch(`${API}/wallet/${state.address}`),
      fetch(`${API}/wallet/${state.address}/transactions`)
    ]);
    const walletData = await walletRes.json();
    const txData = await txRes.json();

    if (walletData.success) {
      // BALANCE FIX: always overwrite from DB — this is the single source of truth
      state.balances = walletData.wallet.balances;
      state.customCoins = walletData.wallet.customCoins || [];
    }
    if (txData.success) {
      state.transactions = txData.transactions;
      const newPending = txData.transactions.filter(t => t.status === 'pending');

      // Auto-switch to pending tab if new pending txs appeared
      const hadPending = state.pendingTxs.length;
      state.pendingTxs = newPending;
      if (newPending.length > 0 && hadPending === 0) {
        // New pending tx arrived — switch to pending tab
        switchTab('pending');
        // Update badge
        chrome.action.setBadgeText({ text: newPending.length.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      } else if (newPending.length === 0) {
        chrome.action.setBadgeText({ text: '' });
      }
    }
    renderAll();
  } catch (e) {
    console.error('Load wallet error:', e);
  }
}

// ─── APPROVE TX ───
async function handleApproveTx() {
  if (!currentTxHash) return;
  const btn = document.getElementById('btn-approve-tx');
  btn.disabled = true; btn.textContent = '...';

  try {
    const res = await fetch(`${API}/wallet/${state.address}/transaction/${currentTxHash}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    const data = await res.json();
    if (data.success) {
      // Update balances immediately from response
      state.balances = data.balances;
      state.pendingTxs = state.pendingTxs.filter(t => t.txHash !== currentTxHash);
      currentTxHash = null;
      await loadWallet();
      showScreen('main');
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {}
  finally { btn.disabled = false; btn.textContent = '✓ Approve'; }
}

async function handleRejectTx() {
  if (!currentTxHash) return;
  const btn = document.getElementById('btn-reject-tx');
  btn.disabled = true; btn.textContent = '...';

  try {
    const res = await fetch(`${API}/wallet/${state.address}/transaction/${currentTxHash}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    const data = await res.json();
    if (data.success) {
      state.pendingTxs = state.pendingTxs.filter(t => t.txHash !== currentTxHash);
      currentTxHash = null;
      await loadWallet();
      showScreen('main');
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {}
  finally { btn.disabled = false; btn.textContent = '✕ Reject'; }
}

// Open full TX detail screen
function openTxScreen(tx) {
  currentTxHash = tx.txHash;
  document.getElementById('tx-from-amount').textContent = tx.fromAmount;
  document.getElementById('tx-from-coin').textContent = tx.fromCoin;
  document.getElementById('tx-to-amount').textContent = parseFloat(tx.toAmount).toFixed(6);
  document.getElementById('tx-to-coin').textContent = tx.toCoin;
  document.getElementById('tx-hash-display').textContent = tx.txHash?.slice(0, 18) + '...';
  showScreen('tx');
}

// Quick approve/reject directly from pending list buttons
window.quickApprove = async (txHash) => {
  currentTxHash = txHash;
  await handleApproveTx();
};
window.quickReject = async (txHash) => {
  currentTxHash = txHash;
  await handleRejectTx();
};
window.openTxDetail = (txHash) => {
  const tx = state.pendingTxs.find(t => t.txHash === txHash);
  if (tx) openTxScreen(tx);
};

// ─── RENDER ───
function renderAll() {
  renderAddress();
  renderPortfolio();
  renderAssets();
  renderActivity();
  renderPending();
}

function renderAddress() {
  const addr = state.address || '';
  document.getElementById('display-address').textContent =
    addr.slice(0, 8) + '...' + addr.slice(-6);
}

function renderPortfolio() {
  const total = Object.entries(state.balances).reduce((sum, [coin, bal]) => {
    return sum + (bal * (PRICES[coin] || 0));
  }, 0);
  document.getElementById('portfolio-value').textContent =
    '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const count = Object.values(state.balances).filter(b => b > 0).length;
  document.getElementById('coins-count').textContent = count;
}

function renderAssets() {
  const container = document.getElementById('assets-list');
  const coins = Object.entries(state.balances);

  if (coins.length === 0) {
    container.innerHTML = '<div class="empty-state">No assets found</div>';
    return;
  }

  container.innerHTML = coins.map(([coin, bal]) => {
    const usd = bal * (PRICES[coin] || 0);
    const color = COIN_COLORS[coin] || '#FF6B00';
    const emoji = COIN_EMOJI[coin] || '?';
    return `
      <div class="asset-row">
        <div class="asset-icon" style="background:${color}20;color:${color};border-color:${color}40">${emoji}</div>
        <div class="asset-info">
          <div class="asset-symbol">${coin}</div>
          <div class="asset-name">${COIN_NAMES[coin] || coin}</div>
        </div>
        <div class="asset-amounts">
          <div class="asset-bal">${bal.toLocaleString('en-US', { maximumFractionDigits: 6 })}</div>
          <div class="asset-usd">$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>`;
  }).join('');

  if (state.customCoins?.length > 0) {
    container.innerHTML += `<div style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#B07050">My Tokens</div>`;
    container.innerHTML += state.customCoins.map(coin => `
      <div class="asset-row">
        <div class="asset-icon" style="background:#FF6B0015;color:#FF6B00;border-color:#FF6B0030">🌟</div>
        <div class="asset-info">
          <div class="asset-symbol">${coin.symbol}</div>
          <div class="asset-name">${coin.name}</div>
        </div>
        <div class="asset-amounts">
          <div class="asset-bal">${coin.balance.toLocaleString()}</div>
          <div class="asset-usd">Custom</div>
        </div>
      </div>`).join('');
  }
}

function renderActivity() {
  const container = document.getElementById('activity-list');
  const txs = state.transactions.slice(0, 10);
  if (txs.length === 0) {
    container.innerHTML = '<div class="empty-state">No transactions yet</div>';
    return;
  }
  const icons = { swap: '🔄', add: '➕', send: '📤', receive: '📥' };
  const badge = s => s === 'approved'
    ? `<span class="badge-success">${s}</span>`
    : s === 'rejected'
    ? `<span class="badge-danger">${s}</span>`
    : `<span class="badge-warn">${s}</span>`;

  container.innerHTML = txs.map(tx => {
    const desc = tx.type === 'swap'
      ? `${tx.fromAmount} ${tx.fromCoin} → ${parseFloat(tx.toAmount).toFixed(4)} ${tx.toCoin}`
      : `Added ${tx.toAmount} ${tx.toCoin}`;
    const time = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '';
    return `
      <div class="activity-row">
        <div class="act-icon">${icons[tx.type] || '💱'}</div>
        <div class="act-info">
          <div class="act-desc">${desc}</div>
          <div class="act-time">${time}</div>
        </div>
        ${badge(tx.status)}
      </div>`;
  }).join('');
}

function renderPending() {
  const container = document.getElementById('pending-list');
  const pendings = state.pendingTxs || [];

  const badge = document.getElementById('pending-count');
  if (pendings.length > 0) {
    badge.textContent = pendings.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  if (pendings.length === 0) {
    container.innerHTML = '<div class="empty-state">✅ No pending transactions</div>';
    return;
  }

  container.innerHTML = pendings.map(tx => `
    <div class="pending-row">
      <div class="pend-top">
        <span class="pend-type">🔄 Swap Pending</span>
        <button class="pend-detail-btn" onclick="openTxDetail('${tx.txHash}')">Details</button>
      </div>
      <div class="pend-swap">
        <div class="ps-coin">
          <div class="ps-amount">${tx.fromAmount}</div>
          <div class="ps-symbol">${tx.fromCoin}</div>
        </div>
        <div class="ps-arrow">→</div>
        <div class="ps-coin to">
          <div class="ps-amount">${parseFloat(tx.toAmount).toFixed(4)}</div>
          <div class="ps-symbol">${tx.toCoin}</div>
        </div>
      </div>
      <div class="pend-hash">${tx.txHash?.slice(0, 24)}...</div>
      <div class="pend-btns">
        <button class="pend-reject" onclick="quickReject('${tx.txHash}')">✕ Reject</button>
        <button class="pend-approve" onclick="quickApprove('${tx.txHash}')">✓ Approve</button>
      </div>
    </div>`).join('');
}

// ─── UTILS ───
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function getStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => resolve(result[key] || null));
  });
}

function setStorage(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
