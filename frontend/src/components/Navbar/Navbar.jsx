import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import './Navbar.css';

export default function Navbar() {
  const { wallet, disconnectWallet, getPortfolioValue, prices } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const portfolioUSD = getPortfolioValue();

  const nav = [
    { path: '/swap', label: 'Swap', icon: '🔄' },
    { path: '/wallet', label: 'Wallet', icon: '👛' },
    { path: '/liquidity', label: 'Liquidity', icon: '💧' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/create', label: 'Create Coin', icon: '💳' },
  ];

  const handleDisconnect = () => {
    disconnectWallet();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/swap" className="nav-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">CoinQuest</span>
        </NavLink>

        <div className="nav-links">
          {nav.map(n => (
            <NavLink key={n.path} to={n.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          <div className="portfolio-badge">
            <span className="portfolio-label">Portfolio</span>
            <span className="portfolio-value">${portfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="wallet-info" onClick={() => navigate('/wallet')}>
            <div className="wallet-dot" />
            <span className="wallet-addr">{wallet?.address?.slice(0,6)}...{wallet?.address?.slice(-4)}</span>
          </div>

          <button className="disconnect-btn" onClick={handleDisconnect} title="Disconnect">
            ⏏
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {nav.map(n => (
            <NavLink key={n.path} to={n.path} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
          <button className="btn-secondary" onClick={handleDisconnect} style={{ margin: '8px 16px' }}>
            Disconnect Wallet
          </button>
        </div>
      )}
    </nav>
  );
}
