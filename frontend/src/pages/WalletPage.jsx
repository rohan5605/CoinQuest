import React, { useState } from 'react';
import { useWallet, COIN_CONFIG } from '../context/WalletContext';
import toast from 'react-hot-toast';
import './WalletPage.css';

const COINS = ['BTC', 'ETH', 'SUI', 'BNB', 'SOL', 'ARB', 'USDT', 'USDC'];

export default function WalletPage() {
  const { wallet, balances, prices, transactions, customCoins, addBalance, getPortfolioValue } = useWallet();
  const [addCoin, setAddCoin] = useState('BTC');
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return toast.error('Enter a valid amount');
    setAdding(true);
    const result = await addBalance(addCoin, parseFloat(addAmount));
    if (result?.success) {
      toast.success(`✅ Added ${addAmount} ${addCoin} to your wallet!`);
      setAddAmount('');
    } else {
      toast.error(result?.error || 'Failed to add balance');
    }
    setAdding(false);
  };

  const portfolioUSD = getPortfolioValue();

  const txTypeIcon = (type) => {
    if (type === 'swap') return '🔄';
    if (type === 'add') return '➕';
    if (type === 'send') return '📤';
    if (type === 'receive') return '📥';
    return '💱';
  };

  const statusColor = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="page wallet-page">
      <h1 className="page-title">My Wallet</h1>
      <p className="page-subtitle">{wallet?.address}</p>

      {/* Portfolio value */}
      <div className="portfolio-hero">
        <div className="portfolio-label-big">Total Portfolio Value</div>
        <div className="portfolio-usd">${portfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className="portfolio-meta">
          <span>🔄 {wallet?.totalSwaps || 0} Swaps</span>
          <span>•</span>
          <span>📊 ${(wallet?.totalVolume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Volume</span>
        </div>
      </div>

      <div className="wallet-grid">
        {/* Left: Balances */}
        <div>
          <div className="card">
            <h3 className="section-title">Token Balances</h3>
            <div className="token-grid">
              {COINS.map(coin => {
                const bal = balances[coin] || 0;
                const usd = bal * (prices[coin] || 0);
                const cfg = COIN_CONFIG[coin];
                return (
                  <div key={coin} className="token-card">
                    <div className="token-card-top">
                      <div className="token-icon-circle" style={{ background: cfg?.color + '20', borderColor: cfg?.color + '40' }}>
                        <span style={{ color: cfg?.color, fontWeight: 900, fontSize: 18 }}>{cfg?.emoji}</span>
                      </div>
                      <div>
                        <div className="tc-symbol">{coin}</div>
                        <div className="tc-name">{cfg?.name}</div>
                      </div>
                    </div>
                    <div className="tc-balance">{bal.toLocaleString('en-US', { maximumFractionDigits: 6 })}</div>
                    <div className="tc-usd">${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="tc-price">@ ${(prices[coin] || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                  </div>
                );
              })}
            </div>

            {/* Custom coins */}
            {customCoins.length > 0 && (
              <>
                <h3 className="section-title" style={{ marginTop: 24 }}>🪙 My Created Coins</h3>
                <div className="token-grid">
                  {customCoins.map((coin, i) => (
                    <div key={i} className="token-card custom-coin-card">
                      <div className="token-card-top">
                        <div className="token-icon-circle" style={{ background: '#FF6B0020', borderColor: '#FF6B0040' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 900 }}>🌟</span>
                        </div>
                        <div>
                          <div className="tc-symbol">{coin.symbol}</div>
                          <div className="tc-name">{coin.name}</div>
                        </div>
                      </div>
                      <div className="tc-balance">{coin.balance.toLocaleString()}</div>
                      <div className="tc-usd">Custom Token</div>
                      <div className="tc-price">Supply: {coin.supply.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Add balance + Transactions */}
        <div className="wallet-right">
          {/* Add balance card */}
          <div className="card add-balance-card">
            <h3 className="section-title">➕ Add Balance</h3>
            <p className="add-hint">Manually add tokens to your wallet</p>

            <div className="add-form">
              <div>
                <label className="form-label">Select Coin</label>
                <div className="coin-picker">
                  {COINS.map(coin => (
                    <button
                      key={coin}
                      className={`coin-pick-btn ${addCoin === coin ? 'active' : ''}`}
                      onClick={() => setAddCoin(coin)}
                    >
                      <span style={{ color: COIN_CONFIG[coin]?.color }}>{COIN_CONFIG[coin]?.emoji}</span>
                      {coin}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Amount</label>
                <div className="add-input-row">
                  <input
                    className="input"
                    type="number"
                    placeholder={`Enter ${addCoin} amount`}
                    value={addAmount}
                    onChange={e => setAddAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    min="0"
                  />
                  <button className="btn-primary add-btn" onClick={handleAdd} disabled={adding}>
                    {adding ? <span className="spinner" /> : '+ Add'}
                  </button>
                </div>
              </div>

              <div className="quick-amounts">
                {['10', '100', '1000', '10000'].map(amt => (
                  <button key={amt} className="quick-btn" onClick={() => setAddAmount(amt)}>
                    +{parseInt(amt) >= 1000 ? amt.slice(0,-3)+'K' : amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <h3 className="section-title">🕒 Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="tx-list">
                {transactions.map((tx, i) => (
                  <div key={i} className="tx-row">
                    <div className="tx-icon">{txTypeIcon(tx.type)}</div>
                    <div className="tx-info">
                      <div className="tx-desc">
                        {tx.type === 'swap'
                          ? `${tx.fromAmount} ${tx.fromCoin} → ${tx.toAmount?.toFixed(4)} ${tx.toCoin}`
                          : `Added ${tx.toAmount} ${tx.toCoin}`}
                      </div>
                      <div className="tx-hash">{tx.txHash?.slice(0, 16)}...</div>
                    </div>
                    <div className={`badge ${statusColor(tx.status)}`}>{tx.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
