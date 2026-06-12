import React, { useState, useEffect } from 'react';
import { useWallet, COIN_CONFIG } from '../context/WalletContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './SwapPage.css';

const COINS = ['BTC', 'ETH', 'SUI', 'BNB', 'SOL', 'ARB', 'USDT', 'USDC'];

export default function SwapPage() {
  const { wallet, balances, prices, initiateSwap, executeSwap, API } = useWallet();
  const [fromCoin, setFromCoin] = useState('ETH');
  const [toCoin, setToCoin] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [useExtension, setUseExtension] = useState(true);

  // Auto-fetch quote when amount changes
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromCoin === toCoin) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromCoin, toCoin]);

  const fetchQuote = async () => {
    setQuoteLoading(true);
    try {
      const { data } = await axios.post(`${API}/swap/quote`, {
        fromCoin, toCoin, fromAmount: parseFloat(fromAmount)
      });
      if (data.success) setQuote(data.quote);
    } catch (e) {
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return toast.error('Enter an amount');
    if (fromCoin === toCoin) return toast.error('Select different coins');
    if (!quote) return toast.error('Get a quote first');

    const bal = balances[fromCoin] || 0;
    if (parseFloat(fromAmount) > bal) return toast.error(`Insufficient ${fromCoin} balance`);

    setLoading(true);
    try {
      if (useExtension) {
        // Creates pending tx for extension approval
        const result = await initiateSwap(fromCoin, toCoin, fromAmount, quote.toAmount);
        if (result?.success) {
          toast.success('Transaction sent to CoinQuestWallet! Approve or Reject in extension.', { duration: 5000 });
          setFromAmount('');
          setQuote(null);
        } else {
          toast.error(result?.error || 'Swap failed');
        }
      } else {
        // Direct swap
        const result = await executeSwap(fromCoin, toCoin, fromAmount, quote.toAmount);
        if (result?.success) {
          toast.success(`✅ Swapped ${fromAmount} ${fromCoin} → ${quote.toAmount} ${toCoin}`);
          setFromAmount('');
          setQuote(null);
        } else {
          toast.error(result?.error || 'Swap failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const flipCoins = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
    setFromAmount('');
    setQuote(null);
  };

  const setMax = () => {
    const bal = balances[fromCoin] || 0;
    setFromAmount(bal.toString());
  };

  const fromBalance = balances[fromCoin] || 0;
  const toBalance = balances[toCoin] || 0;
  const fromPrice = prices[fromCoin] || 0;
  const fromUSD = parseFloat(fromAmount || 0) * fromPrice;

  return (
    <div className="page swap-page">
      <div className="swap-layout">
        {/* Left: Price overview */}
        <div className="price-panel">
          <h3 className="panel-title">Market Prices</h3>
          <div className="price-list">
            {COINS.map(coin => {
              const price = prices[coin] || 0;
              const change = ((Math.random() - 0.4) * 8).toFixed(2);
              const isPos = parseFloat(change) >= 0;
              return (
                <div key={coin} className="price-row" onClick={() => setFromCoin(coin)}>
                  <div className="price-coin-info">
                    <div className="coin-dot" style={{ background: COIN_CONFIG[coin]?.color }} />
                    <div>
                      <div className="price-symbol">{coin}</div>
                      <div className="price-name">{COIN_CONFIG[coin]?.name}</div>
                    </div>
                  </div>
                  <div className="price-values">
                    <div className="price-usd">${price >= 1 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(4)}</div>
                    <div className={`price-change ${isPos ? 'pos' : 'neg'}`}>{isPos ? '▲' : '▼'} {Math.abs(change)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Swap card */}
        <div className="swap-center">
          <div className="swap-card card">
            <div className="swap-header">
              <h2 className="swap-title">Swap</h2>
              <div className="swap-mode-toggle">
                <button
                  className={`mode-btn ${useExtension ? 'active' : ''}`}
                  onClick={() => setUseExtension(true)}
                  title="Send to extension for approval"
                >
                  🔐 Extension
                </button>
                <button
                  className={`mode-btn ${!useExtension ? 'active' : ''}`}
                  onClick={() => setUseExtension(false)}
                  title="Auto approve swap"
                >
                  ⚡ Direct
                </button>
              </div>
            </div>

            {/* From token */}
            <div className="token-box">
              <div className="token-box-header">
                <span className="token-label">From</span>
                <span className="token-balance">Balance: {fromBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {fromCoin}</span>
              </div>
              <div className="token-input-row">
                <input
                  className="token-amount-input"
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  min="0"
                />
                <div className="token-right">
                  <button className="max-btn" onClick={setMax}>MAX</button>
                  <CoinSelector value={fromCoin} onChange={setFromCoin} exclude={toCoin} balances={balances} prices={prices} />
                </div>
              </div>
              {fromAmount && <div className="usd-value">≈ ${fromUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>}
            </div>

            {/* Flip button */}
            <div className="flip-row">
              <button className="flip-btn" onClick={flipCoins}>
                <span className="flip-icon">⇅</span>
              </button>
            </div>

            {/* To token */}
            <div className="token-box">
              <div className="token-box-header">
                <span className="token-label">To</span>
                <span className="token-balance">Balance: {toBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {toCoin}</span>
              </div>
              <div className="token-input-row">
                <div className="token-amount-display">
                  {quoteLoading ? (
                    <span className="loading-dots">...</span>
                  ) : (
                    quote ? quote.toAmount.toLocaleString('en-US', { maximumFractionDigits: 8 }) : '0.00'
                  )}
                </div>
                <CoinSelector value={toCoin} onChange={setToCoin} exclude={fromCoin} balances={balances} prices={prices} />
              </div>
              {quote && <div className="usd-value">≈ ${(quote.toAmount * (prices[toCoin] || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>}
            </div>

            {/* Quote details */}
            {quote && (
              <div className="quote-details">
                <div className="quote-row">
                  <span>Rate</span>
                  <span>1 {fromCoin} = {quote.rate.toFixed(6)} {toCoin}</span>
                </div>
                <div className="quote-row">
                  <span>Fee (0.3%)</span>
                  <span>${quote.fee.toFixed(4)}</span>
                </div>
                <div className="quote-row">
                  <span>Price Impact</span>
                  <span className={quote.priceImpact > 1 ? 'text-warning' : 'text-success'}>{quote.priceImpact}%</span>
                </div>
                <div className="quote-row">
                  <span>Min Received</span>
                  <span>{quote.minimumReceived.toFixed(6)} {toCoin}</span>
                </div>
              </div>
            )}

            <button
              className="btn-primary swap-btn"
              onClick={handleSwap}
              disabled={loading || !fromAmount || !quote}
            >
              {loading ? <span className="spinner" /> : useExtension ? '🔐 Swap via Extension' : '⚡ Swap Now'}
            </button>

            {useExtension && (
              <p className="extension-hint">
                Transaction will appear in <strong>CoinQuestWallet</strong> for approval
              </p>
            )}
          </div>

          {/* Recent transaction info */}
          <div className="swap-info-row">
            <div className="info-chip">🔒 Secure Transactions</div>
            <div className="info-chip">⚡ Instant Settlement</div>
            <div className="info-chip">💰 0.3% Fee</div>
          </div>
        </div>

        {/* Right: Quick balance */}
        <div className="balance-panel">
          <h3 className="panel-title">Your Balances</h3>
          <div className="balance-list">
            {COINS.map(coin => {
              const bal = balances[coin] || 0;
              const usd = bal * (prices[coin] || 0);
              return (
                <div key={coin} className="balance-row">
                  <div className="balance-coin">
                    <div className="coin-dot" style={{ background: COIN_CONFIG[coin]?.color }} />
                    <span>{coin}</span>
                  </div>
                  <div className="balance-amounts">
                    <div className="bal-amount">{bal.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div>
                    <div className="bal-usd">${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoinSelector({ value, onChange, exclude, balances, prices }) {
  const [open, setOpen] = useState(false);
  const cfg = COIN_CONFIG[value];

  return (
    <div className="coin-selector">
      <button className="coin-select-btn" onClick={() => setOpen(!open)}>
        <div className="coin-dot-sm" style={{ background: cfg?.color }} />
        <span className="coin-sym">{value}</span>
        <span className="coin-arrow">▾</span>
      </button>
      {open && (
        <div className="coin-dropdown">
          {['BTC','ETH','SUI','BNB','SOL','ARB','USDT','USDC'].filter(c => c !== exclude).map(coin => (
            <div
              key={coin}
              className="coin-option"
              onClick={() => { onChange(coin); setOpen(false); }}
            >
              <div className="coin-dot-sm" style={{ background: COIN_CONFIG[coin]?.color }} />
              <div>
                <div className="co-symbol">{coin}</div>
                <div className="co-name">{COIN_CONFIG[coin]?.name}</div>
              </div>
              <div className="co-balance">{(balances[coin] || 0).toFixed(4)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
