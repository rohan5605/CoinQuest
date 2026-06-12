import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './LiquidityPage.css';

export default function LiquidityPage() {
  const { wallet, balances, API } = useWallet();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removePct, setRemovePct] = useState(50);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const { data } = await axios.get(`${API}/liquidity`);
      if (data.success) setPools(data.pools);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!selectedPool || !amount0 || !amount1) return toast.error('Fill in both amounts');
    setAdding(true);
    try {
      const { data } = await axios.post(`${API}/liquidity/add`, {
        address: wallet.address,
        pair: selectedPool.pair,
        amount0: parseFloat(amount0),
        amount1: parseFloat(amount1)
      });
      if (data.success) {
        toast.success('💧 Liquidity added!');
        setAmount0(''); setAmount1('');
        fetchPools();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add liquidity');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedPool) return;
    setRemoving(true);
    try {
      const { data } = await axios.post(`${API}/liquidity/remove`, {
        address: wallet.address,
        pair: selectedPool.pair,
        percentage: removePct
      });
      if (data.success) {
        toast.success(`✅ Removed ${removePct}% liquidity`);
        fetchPools();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'No liquidity to remove');
    } finally {
      setRemoving(false);
    }
  };

  const totalTVL = pools.reduce((s, p) => s + p.totalLiquidity, 0);
  const total24hVol = pools.reduce((s, p) => s + p.volume24h, 0);

  return (
    <div className="page liquidity-page">
      <h1 className="page-title">💧 Liquidity Pools</h1>
      <p className="page-subtitle">Provide liquidity and earn trading fees</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">${(totalTVL / 1e6).toFixed(1)}M</div>
          <div className="stat-label">Total TVL</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${(total24hVol / 1e6).toFixed(1)}M</div>
          <div className="stat-label">24H Volume</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pools.length}</div>
          <div className="stat-label">Active Pools</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0.3%</div>
          <div className="stat-label">Trading Fee</div>
        </div>
      </div>

      <div className="liq-layout">
        {/* Pool list */}
        <div className="pools-list card">
          <h3 className="section-title">Available Pools</h3>
          {loading ? (
            <div>{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12, marginBottom: 8 }} />)}</div>
          ) : (
            pools.map((pool, i) => (
              <div
                key={i}
                className={`pool-row ${selectedPool?.pair === pool.pair ? 'selected' : ''}`}
                onClick={() => setSelectedPool(pool)}
              >
                <div className="pool-pair-info">
                  <div className="pool-icons">
                    <div className="pool-icon">{pool.token0[0]}</div>
                    <div className="pool-icon second">{pool.token1[0]}</div>
                  </div>
                  <div>
                    <div className="pool-pair">{pool.pair}</div>
                    <div className="pool-fee">Fee: {pool.fee}%</div>
                  </div>
                </div>
                <div className="pool-stats">
                  <div className="pool-stat">
                    <div className="ps-value">${(pool.totalLiquidity / 1e6).toFixed(1)}M</div>
                    <div className="ps-label">TVL</div>
                  </div>
                  <div className="pool-stat">
                    <div className="ps-value apy">{pool.apy}%</div>
                    <div className="ps-label">APY</div>
                  </div>
                  <div className="pool-stat">
                    <div className="ps-value">${(pool.volume24h / 1e3).toFixed(0)}K</div>
                    <div className="ps-label">24H Vol</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Remove liquidity */}
        {selectedPool ? (
          <div className="liq-actions">
            <div className="card">
              <h3 className="section-title">Add Liquidity to {selectedPool.pair}</h3>
              <div className="liq-form">
                <div className="liq-input-group">
                  <label className="form-label">{selectedPool.token0} Amount</label>
                  <div className="liq-input-row">
                    <input
                      className="input"
                      type="number"
                      placeholder="0.00"
                      value={amount0}
                      onChange={e => setAmount0(e.target.value)}
                    />
                    <span className="input-coin-label">{selectedPool.token0}</span>
                  </div>
                  <span className="bal-hint">Balance: {(balances[selectedPool.token0] || 0).toFixed(4)}</span>
                </div>
                <div className="plus-divider">+</div>
                <div className="liq-input-group">
                  <label className="form-label">{selectedPool.token1} Amount</label>
                  <div className="liq-input-row">
                    <input
                      className="input"
                      type="number"
                      placeholder="0.00"
                      value={amount1}
                      onChange={e => setAmount1(e.target.value)}
                    />
                    <span className="input-coin-label">{selectedPool.token1}</span>
                  </div>
                  <span className="bal-hint">Balance: {(balances[selectedPool.token1] || 0).toFixed(4)}</span>
                </div>
                <button className="btn-primary" onClick={handleAdd} disabled={adding}>
                  {adding ? <span className="spinner" /> : '💧 Add Liquidity'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Remove Liquidity</h3>
              <div className="remove-form">
                <div className="pct-label">{removePct}%</div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={removePct}
                  onChange={e => setRemovePct(parseInt(e.target.value))}
                  className="range-slider"
                />
                <div className="pct-presets">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct} className={`pct-btn ${removePct === pct ? 'active' : ''}`} onClick={() => setRemovePct(pct)}>
                      {pct}%
                    </button>
                  ))}
                </div>
                <button className="btn-secondary" onClick={handleRemove} disabled={removing} style={{ width: '100%' }}>
                  {removing ? <span className="spinner" /> : `🔓 Remove ${removePct}%`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card select-pool-hint">
            <span>💧</span>
            <p>Select a pool to add or remove liquidity</p>
          </div>
        )}
      </div>
    </div>
  );
}
