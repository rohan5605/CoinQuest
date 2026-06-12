import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';
import './ConnectPage.css';

const DEMO_ADDRESSES = [
  '0x742d35Cc6634C0532925a3b8D4C9C2b06c7e4B91',
  '0x53d284357ec70cE289D6D64134DfAc8E511c8a3D',
  '0x1234567890AbCdEf1234567890AbCdEf12345678',
];

const FLOATING_COINS = ['₿', 'Ξ', '◎', '🟡', '🔵', '₮', '$', '🔷'];

export default function ConnectPage() {
  const { connectWallet, loading } = useWallet();
  const [address, setAddress] = useState('');

  const handleConnect = async () => {
    if (!address.trim()) return toast.error('Enter a wallet address');
    if (address.length < 10) return toast.error('Invalid wallet address');
    toast.loading('Connecting wallet...', { id: 'connect' });
    await connectWallet(address.trim());
    toast.success('Wallet connected!', { id: 'connect' });
  };

  const handleDemo = (addr) => {
    setAddress(addr);
    setTimeout(() => connectWallet(addr), 100);
    toast.success('Demo wallet loaded!');
  };

  return (
    <div className="connect-page">
      {/* Floating coins */}
      <div className="floating-coins">
        {FLOATING_COINS.map((coin, i) => (
          <div key={i} className="floating-coin" style={{ '--i': i, '--delay': `${i * 0.4}s`, '--x': `${10 + i * 11}%` }}>
            {coin}
          </div>
        ))}
      </div>

      {/* Glow orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="connect-container">
        {/* Logo */}
        <div className="connect-logo">
          <div className="logo-icon">
            <span>⬡</span>
          </div>
          <h1 className="logo-text">CoinQuest</h1>
          <p className="logo-tagline">The Next-Gen DeFi Swap Platform</p>
        </div>

        {/* Stats ticker */}
        <div className="stats-ticker">
          <div className="ticker-inner">
            <span>24H Vol: $4.2B</span>
            <span>•</span>
            <span>Total Liquidity: $820M</span>
            <span>•</span>
            <span>Supported Pairs: 28+</span>
            <span>•</span>
            <span>Active Wallets: 142K</span>
            <span>•</span>
            <span>24H Vol: $4.2B</span>
            <span>•</span>
            <span>Total Liquidity: $820M</span>
          </div>
        </div>

        {/* Connect card */}
        <div className="connect-card">
          <div className="connect-card-header">
            <div className="wallet-icon-circle">
              <span>🔗</span>
            </div>
            <h2>Connect Wallet</h2>
            <p>Enter your wallet address to access CoinQuest</p>
          </div>

          <div className="connect-form">
            <div className="input-wrapper">
              <input
                className="input"
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <button
              className="btn-primary connect-btn"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>🔗 Connect Wallet</>
              )}
            </button>
          </div>

          <div className="divider"><span>or try a demo wallet</span></div>

          <div className="demo-wallets">
            {DEMO_ADDRESSES.map((addr, i) => (
              <button key={i} className="demo-btn" onClick={() => handleDemo(addr)}>
                <span className="demo-num">#{i + 1}</span>
                <span className="demo-addr">{addr.slice(0, 8)}...{addr.slice(-6)}</span>
                <span className="demo-tag">Demo</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="features-row">
          {[
            { icon: '🔄', label: 'Instant Swap' },
            { icon: '💧', label: 'Liquidity Pools' },
            { icon: '🏆', label: 'Leaderboard' },
            { icon: '🪙', label: 'Create Coins' },
          ].map((f, i) => (
            <div key={i} className="feature-chip">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <p className="connect-footer">
          Use with <strong>CoinQuestWallet</strong> extension for full transaction control
        </p>
      </div>
    </div>
  );
}
