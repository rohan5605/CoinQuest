import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';
import './PendingTxModal.css';

export default function PendingTxModal() {
  const { pendingTx, setPendingTx, approveTransaction, rejectTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  if (!pendingTx) return null;

  const handleApprove = async () => {
    setLoading(true);
    const result = await approveTransaction(pendingTx.txHash);
    if (result?.success) {
      toast.success('✅ Transaction Approved!');
    } else {
      toast.error(result?.error || 'Failed to approve');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const result = await rejectTransaction(pendingTx.txHash);
    if (result?.success) {
      toast.error('❌ Transaction Rejected');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPendingTx(null)}>
      <div className="tx-modal">
        {/* Header */}
        <div className="tx-modal-header">
          <div className="wallet-logo">
            <span>⬡</span>
          </div>
          <div>
            <h2 className="modal-title">CoinQuestWallet</h2>
            <p className="modal-sub">Transaction Request</p>
          </div>
          <button className="modal-close" onClick={() => setPendingTx(null)}>✕</button>
        </div>

        {/* Site info */}
        <div className="site-info">
          <div className="site-icon">🌐</div>
          <div>
            <div className="site-url">localhost:3000</div>
            <div className="site-label">CoinQuest Platform</div>
          </div>
          <div className="site-badge">Trusted</div>
        </div>

        {/* Transaction details */}
        <div className="tx-details-box">
          <div className="tx-type-badge">
            🔄 Swap Transaction
          </div>

          <div className="tx-swap-visual">
            <div className="tx-coin-box">
              <div className="tx-coin-amount">{pendingTx.fromAmount}</div>
              <div className="tx-coin-name">{pendingTx.fromCoin}</div>
            </div>
            <div className="tx-arrow">→</div>
            <div className="tx-coin-box to">
              <div className="tx-coin-amount">{parseFloat(pendingTx.toAmount).toFixed(6)}</div>
              <div className="tx-coin-name">{pendingTx.toCoin}</div>
            </div>
          </div>

          <div className="tx-meta">
            <div className="tx-meta-row">
              <span>Transaction Hash</span>
              <span className="tx-hash-val">{pendingTx.txHash?.slice(0, 20)}...</span>
            </div>
            <div className="tx-meta-row">
              <span>Network Fee</span>
              <span>~$0.50</span>
            </div>
            <div className="tx-meta-row">
              <span>Status</span>
              <span className="badge badge-warning">Pending</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="tx-warning">
          ⚠️ Review the transaction details carefully before approving.
        </div>

        {/* Action buttons */}
        <div className="tx-modal-actions">
          <button
            className="btn-secondary reject-btn"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '✕ Reject'}
          </button>
          <button
            className="btn-primary approve-btn"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '✓ Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
