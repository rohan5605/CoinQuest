import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';
import './CreateCoinPage.css';

export default function CreateCoinPage() {
  const { createCoin, customCoins } = useWallet();
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    supply: '',
    decimals: '18',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.symbol || !form.supply) {
      return toast.error('Name, Symbol, and Supply are required');
    }
    if (form.symbol.length > 10) return toast.error('Symbol max 10 characters');
    if (parseFloat(form.supply) <= 0) return toast.error('Supply must be positive');

    setCreating(true);
    const result = await createCoin(
      form.name,
      form.symbol.toUpperCase(),
      parseFloat(form.supply),
      parseInt(form.decimals)
    );

    if (result?.success) {
      setCreated(result.coin);
      toast.success(`🪙 ${form.name} (${form.symbol.toUpperCase()}) created!`);
      setForm({ name: '', symbol: '', supply: '', decimals: '18', description: '' });
    } else {
      toast.error(result?.error || 'Failed to create coin');
    }
    setCreating(false);
  };

  const exampleTokens = [
    { name: 'MyToken', symbol: 'MTK', supply: '1,000,000', decimals: 18, useCase: 'General purpose token' },
    { name: 'GameCoin', symbol: 'GMC', supply: '100,000,000', decimals: 8, useCase: 'Gaming rewards' },
    { name: 'StableX', symbol: 'STX', supply: '10,000', decimals: 6, useCase: 'Stable value token' },
  ];

  return (
    <div className="page create-coin-page">
      <h1 className="page-title">🪙 Create Your Token</h1>
      <p className="page-subtitle">Launch your own crypto token in seconds</p>

      <div className="create-layout">
        {/* Form */}
        <div className="create-form-card card">
          <div className="form-header">
            <div className="form-header-icon">🚀</div>
            <div>
              <h2>Token Creator</h2>
              <p>Fill in the details to mint your custom token</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Token Name *</label>
              <input
                className="input"
                name="name"
                placeholder="e.g. MyAwesomeToken"
                value={form.name}
                onChange={handleChange}
                maxLength={50}
              />
              <span className="char-count">{form.name.length}/50</span>
            </div>

            <div className="form-group">
              <label className="form-label">Token Symbol *</label>
              <input
                className="input"
                name="symbol"
                placeholder="e.g. MAT"
                value={form.symbol}
                onChange={handleChange}
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              <span className="char-count">{form.symbol.length}/10</span>
            </div>

            <div className="form-group">
              <label className="form-label">Decimals</label>
              <select className="input" name="decimals" value={form.decimals} onChange={handleChange}>
                <option value="2">2 (Like USD)</option>
                <option value="6">6 (Like USDC)</option>
                <option value="8">8 (Like BTC)</option>
                <option value="18">18 (Like ETH)</option>
              </select>
            </div>

            <div className="form-group full">
              <label className="form-label">Total Supply *</label>
              <input
                className="input"
                name="supply"
                type="number"
                placeholder="e.g. 1000000"
                value={form.supply}
                onChange={handleChange}
                min="1"
              />
              <div className="supply-presets">
                {['1000', '1000000', '100000000', '21000000'].map(s => (
                  <button key={s} className="supply-preset-btn" onClick={() => setForm(p => ({ ...p, supply: s }))}>
                    {parseInt(s) >= 1e8 ? s.slice(0,-6)+'M' : parseInt(s) >= 1e6 ? s.slice(0,-6)+'M' : parseInt(s) >= 1000 ? parseInt(s)/1000+'K' : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group full">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="input"
                name="description"
                placeholder="What is your token for?"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={200}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Preview */}
          {(form.name || form.symbol) && (
            <div className="token-preview">
              <div className="preview-label">Token Preview</div>
              <div className="preview-card">
                <div className="preview-icon">🌟</div>
                <div>
                  <div className="preview-name">{form.name || 'Token Name'}</div>
                  <div className="preview-sym">{form.symbol?.toUpperCase() || 'SYM'}</div>
                </div>
                <div className="preview-supply">
                  <div>{parseFloat(form.supply || 0).toLocaleString()}</div>
                  <div className="preview-sup-label">Total Supply</div>
                </div>
              </div>
            </div>
          )}

          <button className="btn-primary create-btn" onClick={handleCreate} disabled={creating}>
            {creating ? <><span className="spinner" /> Creating...</> : '🚀 Create Token'}
          </button>
        </div>

        {/* Right side */}
        <div className="create-right">
          {/* Success card */}
          {created && (
            <div className="success-card card">
              <div className="success-header">
                <span className="success-icon">🎉</span>
                <h3>Token Created!</h3>
              </div>
              <div className="success-details">
                <div className="sd-row"><span>Name</span><strong>{created.name}</strong></div>
                <div className="sd-row"><span>Symbol</span><strong>{created.symbol}</strong></div>
                <div className="sd-row"><span>Supply</span><strong>{created.supply?.toLocaleString()}</strong></div>
                <div className="sd-row"><span>Decimals</span><strong>{created.decimals}</strong></div>
              </div>
              <div className="success-confetti">Your token is now in your wallet! 🎊</div>
            </div>
          )}

          {/* Examples */}
          <div className="card">
            <h3 className="section-title">💡 Token Examples</h3>
            <div className="examples-list">
              {exampleTokens.map((t, i) => (
                <div key={i} className="example-card" onClick={() => setForm(p => ({
                  ...p, name: t.name, symbol: t.symbol,
                  supply: t.supply.replace(/,/g, ''),
                  decimals: t.decimals.toString()
                }))}>
                  <div className="example-icon">🪙</div>
                  <div>
                    <div className="ex-name">{t.name} <span className="ex-sym">({t.symbol})</span></div>
                    <div className="ex-use">{t.useCase}</div>
                    <div className="ex-details">Supply: {t.supply} • Decimals: {t.decimals}</div>
                  </div>
                  <span className="ex-use-btn">Use →</span>
                </div>
              ))}
            </div>
          </div>

          {/* My Tokens */}
          {customCoins.length > 0 && (
            <div className="card">
              <h3 className="section-title">My Tokens ({customCoins.length})</h3>
              <div className="my-tokens-list">
                {customCoins.map((coin, i) => (
                  <div key={i} className="my-token-row">
                    <span className="mt-icon">🌟</span>
                    <div>
                      <div className="mt-name">{coin.name}</div>
                      <div className="mt-symbol">{coin.symbol}</div>
                    </div>
                    <div className="mt-supply">
                      <div>{coin.balance?.toLocaleString()}</div>
                      <div className="mt-label">Balance</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info card */}
          <div className="info-card card">
            <h3 className="section-title">ℹ️ How it works</h3>
            <div className="info-steps">
              {[
                { step: '1', text: 'Fill in token name, symbol and supply' },
                { step: '2', text: 'Click Create Token button' },
                { step: '3', text: 'Token appears in your wallet instantly' },
                { step: '4', text: 'Use it in swaps or share with others' },
              ].map((s, i) => (
                <div key={i} className="info-step">
                  <div className="step-num">{s.step}</div>
                  <div className="step-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
