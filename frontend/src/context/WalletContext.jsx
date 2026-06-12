import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

// Extension ID - after loading extension in Chrome, replace this with your actual extension ID
// Found at chrome://extensions/ page
const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';

const WalletContext = createContext(null);

export const COIN_CONFIG = {
  BTC:  { emoji: '₿', color: '#F7931A', name: 'Bitcoin' },
  ETH:  { emoji: 'Ξ', color: '#627EEA', name: 'Ethereum' },
  SUI:  { emoji: '🔵', color: '#4CA3FF', name: 'Sui' },
  BNB:  { emoji: '🟡', color: '#F3BA2F', name: 'BNB' },
  SOL:  { emoji: '◎', color: '#9945FF', name: 'Solana' },
  ARB:  { emoji: '🔷', color: '#2D374B', name: 'Arbitrum' },
  USDT: { emoji: '₮', color: '#26A17B', name: 'Tether' },
  USDC: { emoji: '$', color: '#2775CA', name: 'USD Coin' },
};

// Notify extension about new pending transaction
// Extension will auto-open popup showing the pending tx
function notifyExtension(type, payload = {}) {
  try {
    if (window.chrome && chrome.runtime && EXTENSION_ID !== 'YOUR_EXTENSION_ID_HERE') {
      chrome.runtime.sendMessage(EXTENSION_ID, { type, ...payload });
    }
  } catch (e) {
    // Extension not installed or ID not set — silent fail
  }
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [customCoins, setCustomCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);

  // Fetch prices every 30s
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(`${API}/swap/prices`);
        if (data.success) setPrices(data.prices);
      } catch (e) {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh balances every 10s to stay in sync with extension approvals
  useEffect(() => {
    if (!wallet) return;
    const interval = setInterval(() => refreshBalances(wallet.address), 10000);
    return () => clearInterval(interval);
  }, [wallet]);

  // Load wallet from localStorage on mount
  // KEY: 'cq_wallet_address' — same key the extension uses via storage sync
  useEffect(() => {
    const saved = localStorage.getItem('cq_wallet_address');
    if (saved) connectWallet(saved);
  }, []);

  // Refresh only balances + transactions (called by polling)
  const refreshBalances = async (address) => {
    try {
      const addr = address || wallet?.address;
      if (!addr) return;
      const [balRes, txRes] = await Promise.all([
        axios.get(`${API}/wallet/${addr}/balances`),
        axios.get(`${API}/wallet/${addr}/transactions`)
      ]);
      if (balRes.data.success) {
        setBalances(balRes.data.balances);
        setCustomCoins(balRes.data.customCoins || []);
      }
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions);
        // If a pending tx got approved/rejected via extension, clear modal
        const stillPending = txRes.data.transactions.find(t => t.status === 'pending');
        if (!stillPending) setPendingTx(null);
      }
    } catch (e) {}
  };

  const connectWallet = useCallback(async (address) => {
    if (!address) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/wallet/connect`, { address: address.toLowerCase() });
      if (data.success) {
        setWallet(data.wallet);
        setBalances(data.wallet.balances);
        setCustomCoins(data.wallet.customCoins || []);
        // Store with key 'cq_wallet_address' — extension reads this same key
        localStorage.setItem('cq_wallet_address', address.toLowerCase());
        await fetchTransactions(address.toLowerCase());
        // Tell extension the wallet address so it can sync
        notifyExtension('WALLET_CONNECTED', { address: address.toLowerCase() });
      }
    } catch (e) {
      console.error('Connect wallet error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setBalances({});
    setTransactions([]);
    setCustomCoins([]);
    setPendingTx(null);
    localStorage.removeItem('cq_wallet_address');
  }, []);

  const fetchTransactions = async (address) => {
    try {
      const addr = address || wallet?.address;
      if (!addr) return;
      const { data } = await axios.get(`${API}/wallet/${addr}/transactions`);
      if (data.success) setTransactions(data.transactions);
    } catch (e) {}
  };

  const addBalance = async (coin, amount) => {
    if (!wallet) return;
    try {
      const { data } = await axios.post(`${API}/wallet/${wallet.address}/add-balance`, { coin, amount });
      if (data.success) {
        setBalances(data.balances);
        await fetchTransactions();
        return { success: true };
      }
    } catch (e) {
      return { error: e.response?.data?.error || 'Failed to add balance' };
    }
  };

  // initiateSwap — creates PENDING tx, shows modal on website, notifies extension
  const initiateSwap = async (fromCoin, toCoin, fromAmount, toAmount) => {
    if (!wallet) return;
    try {
      const { data } = await axios.post(`${API}/swap/initiate`, {
        address: wallet.address, fromCoin, toCoin, fromAmount, toAmount
      });
      if (data.success) {
        // Show modal on website
        setPendingTx(data.transaction);
        await fetchTransactions();
        // Signal extension to open popup and show pending tx
        notifyExtension('NEW_PENDING_TX', {
          address: wallet.address,
          txHash: data.txHash,
          fromCoin, toCoin, fromAmount, toAmount
        });
        return { success: true, txHash: data.txHash, pendingTx: data.transaction };
      }
    } catch (e) {
      return { error: e.response?.data?.error || 'Swap failed' };
    }
  };

  const executeSwap = async (fromCoin, toCoin, fromAmount, toAmount) => {
    if (!wallet) return;
    try {
      const { data } = await axios.post(`${API}/swap/execute`, {
        address: wallet.address, fromCoin, toCoin, fromAmount, toAmount
      });
      if (data.success) {
        setBalances(data.balances);
        await fetchTransactions();
        return { success: true, txHash: data.txHash };
      }
    } catch (e) {
      return { error: e.response?.data?.error || 'Swap failed' };
    }
  };

  const approveTransaction = async (txHash) => {
    if (!wallet) return;
    try {
      const { data } = await axios.patch(`${API}/wallet/${wallet.address}/transaction/${txHash}`, { status: 'approved' });
      if (data.success) {
        setBalances(data.balances);
        setPendingTx(null);
        await fetchTransactions();
        return { success: true };
      }
    } catch (e) {
      return { error: e.response?.data?.error || 'Failed' };
    }
  };

  const rejectTransaction = async (txHash) => {
    if (!wallet) return;
    try {
      const { data } = await axios.patch(`${API}/wallet/${wallet.address}/transaction/${txHash}`, { status: 'rejected' });
      if (data.success) {
        setPendingTx(null);
        await fetchTransactions();
        return { success: true };
      }
    } catch (e) {
      return { error: 'Failed to reject' };
    }
  };

  const createCoin = async (name, symbol, supply, decimals) => {
    if (!wallet) return;
    try {
      const { data } = await axios.post(`${API}/coins/create`, {
        address: wallet.address, name, symbol, supply, decimals
      });
      if (data.success) {
        setCustomCoins(prev => [...prev, data.coin]);
        return { success: true, coin: data.coin };
      }
    } catch (e) {
      return { error: e.response?.data?.error || 'Failed to create coin' };
    }
  };

  const getPortfolioValue = () => {
    return Object.entries(balances).reduce((sum, [coin, bal]) => {
      return sum + (bal * (prices[coin] || 0));
    }, 0);
  };

  return (
    <WalletContext.Provider value={{
      wallet, balances, prices, transactions, customCoins,
      loading, pendingTx, setPendingTx,
      connectWallet, disconnectWallet,
      addBalance, initiateSwap, executeSwap,
      approveTransaction, rejectTransaction,
      createCoin, fetchTransactions, refreshBalances,
      getPortfolioValue, API
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
