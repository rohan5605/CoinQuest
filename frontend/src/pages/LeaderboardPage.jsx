import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const { wallet, API } = useWallet();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axios.get(`${API}/leaderboard`);
        if (data.success) setLeaderboard(data.leaderboard);
      } catch (e) {}
      finally { setLoading(false); }
    };
    fetchLeaderboard();
  }, []);

  const myRank = leaderboard.find(w => w.address === wallet?.address);

  const rankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="page leaderboard-page">
      <h1 className="page-title">🏆 Leaderboard</h1>
      <p className="page-subtitle">Top traders ranked by portfolio value</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{leaderboard.length}</div>
          <div className="stat-label">Total Traders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{leaderboard.reduce((s, w) => s + w.totalSwaps, 0)}</div>
          <div className="stat-label">Total Swaps</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${(leaderboard.reduce((s, w) => s + w.totalVolume, 0) / 1000).toFixed(0)}K</div>
          <div className="stat-label">Total Volume</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{myRank ? `#${myRank.rank}` : 'N/A'}</div>
          <div className="stat-label">Your Rank</div>
        </div>
      </div>

      {/* My rank highlight */}
      {myRank && (
        <div className="my-rank-card card">
          <div className="my-rank-label">Your Position</div>
          <div className="my-rank-inner">
            <div className="rank-num">{rankEmoji(myRank.rank)}</div>
            <div className="rank-addr">{myRank.shortAddress}</div>
            <div className="rank-tag you-tag">YOU</div>
            <div className="rank-value">${myRank.portfolioValue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="card lb-card">
        {loading ? (
          <div className="lb-loading">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="shimmer" style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <span>🏆</span>
            <p>No traders yet — be the first!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Portfolio Value</th>
                <th>Total Swaps</th>
                <th>Volume</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((trader, i) => {
                const isMe = trader.address === wallet?.address;
                return (
                  <tr key={i} className={isMe ? 'my-row' : ''}>
                    <td>
                      <span className={`rank-badge ${i < 3 ? 'top-rank' : ''}`}>
                        {rankEmoji(trader.rank)}
                      </span>
                    </td>
                    <td>
                      <div className="addr-cell">
                        <span className="addr-text">{trader.shortAddress}</span>
                        {isMe && <span className="you-tag">YOU</span>}
                      </div>
                    </td>
                    <td>
                      <span className="value-text">${trader.portfolioValue.toLocaleString()}</span>
                    </td>
                    <td>{trader.totalSwaps}</td>
                    <td>${(trader.totalVolume / 1000).toFixed(1)}K</td>
                    <td className="text-muted">
                      {new Date(trader.lastActive).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
