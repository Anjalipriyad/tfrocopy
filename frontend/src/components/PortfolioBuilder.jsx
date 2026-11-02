import React, { useState, useEffect } from 'react';
import RiskGauge from './RiskGauge';
import SectorHeatmap from './SectorHeatmap';
import LoadingOverlay from './LoadingOverlay';

// Utility to safely load JSON from localStorage with fallback
function loadFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://topological-financial-risk-optimizer.onrender.com' : 'http://localhost:8000');

export default function PortfolioBuilder({ onSelectTicker }) {
  const defaultHoldings = [
    { ticker: 'AAPL', weight: 40 },
    { ticker: 'NVDA', weight: 30 },
    { ticker: 'TSLA', weight: 30 },
  ];
  const [holdingsInput, setHoldingsInput] = useState(() => loadFromStorage('tfro_portfolio_holdings', defaultHoldings));
  const [newTicker, setNewTicker] = useState('');
  const [newWeight, setNewWeight] = useState(10);
  const [portfolioData, setPortfolioData] = useState(() => loadFromStorage('tfro_portfolio_data', null));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Compute weight sum
  const weightSum = holdingsInput.reduce((sum, h) => sum + (parseFloat(h.weight) || 0), 0);
  const isSumValid = Math.abs(weightSum - 100) <= 1.0;
  // Persist holdings to localStorage
  useEffect(() => {
    localStorage.setItem('tfro_portfolio_holdings', JSON.stringify(holdingsInput));
  }, [holdingsInput]);

  const handleAddRow = () => {
    if (!newTicker.trim()) return;
    setHoldingsInput([
      ...holdingsInput,
      { ticker: newTicker.trim().toUpperCase(), weight: parseFloat(newWeight) || 0 }
    ]);
    setNewTicker('');
    setNewWeight(10);
  };

  const handleRemoveRow = (index) => {
    setHoldingsInput(holdingsInput.filter((_, i) => i !== index));
  };

  const handleWeightChange = (index, val) => {
    const updated = [...holdingsInput];
    updated[index].weight = parseFloat(val) || 0;
    setHoldingsInput(updated);
  };

  const handleAnalyze = async () => {
    if (holdingsInput.length === 0) {
      setError('Please add at least one holding to your portfolio.');
      return;
    }
    setIsLoading(true);
    setError(null);

    // Convert weights to fraction (0.0 - 1.0) if sum is ~100
    const formattedHoldings = holdingsInput.map((h) => ({
      ticker: h.ticker.toUpperCase(),
      weight: h.weight / 100.0,
    }));

    try {
      const res = await fetch(`${API_BASE}/portfolio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: formattedHoldings }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Analysis failed (${res.status})`);
      }

      const json = await res.json();
      setPortfolioData(json);
    } catch (err) {
      setError(err.message || 'Failed to analyze portfolio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Portfolio Editor Card */}
      <div className="card-premium" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Portfolio Risk Aggregator
            </h2>
            <p className="label-xs" style={{ marginTop: 2 }}>
              Multi-Asset Topological Weight & Stress Analyzer
            </p>
          </div>

          {/* Running weight sum badge */}
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              background: isSumValid ? 'var(--status-safe-bg)' : 'var(--gold-bg)',
              border: `1px solid ${isSumValid ? 'rgba(5,150,105,0.3)' : 'var(--gold-border)'}`,
              color: isSumValid ? 'var(--status-safe)' : 'var(--gold)',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Allocation Sum: {weightSum.toFixed(1)}%</span>
            {!isSumValid && (
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.9 }}>
                (Will auto-normalize)
              </span>
            )}
          </div>
        </div>

        {/* Holdings Table Editor */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Asset Ticker</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Allocation Weight (%)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdingsInput.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {item.ticker}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.weight}
                      onChange={(e) => handleWeightChange(idx, e.target.value)}
                      style={{
                        width: 100,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-base)',
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add New Row */}
              <tr style={{ background: 'var(--bg-glass)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <input
                    type="text"
                    placeholder="e.g. MSFT or RELIANCE.NS"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    style={{
                      width: 180,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      background: 'white',
                      fontSize: 13,
                    }}
                  />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    style={{
                      width: 100,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      background: 'white',
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <button onClick={handleAddRow} className="btn-glass" style={{ padding: '6px 16px', fontSize: 12 }}>
                    + Add Holding
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={handleAnalyze}
          className="btn-primary"
          style={{ width: '100%', padding: '14px' }}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing Portfolio...' : 'Analyze Portfolio Stress'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--status-danger-bg)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--status-danger)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {isLoading && <LoadingOverlay message="Computing portfolio topological risk aggregation & contribution flags..." />}

      {/* Analysis Results Display */}
      {portfolioData && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Top Score Banner */}
          <div className="card-premium" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Aggregate Portfolio Risk Profile
            </h3>

            <RiskGauge score={Math.round(portfolioData.portfolio_risk_score)} riskLevel={portfolioData.risk_level} />

            <div style={{ textAlign: 'center', maxWidth: 600 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {portfolioData.recommendation}
              </p>
              {portfolioData.weights_normalized && (
                <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 6, fontWeight: 700 }}>
                  Note: Holdings weights were automatically re-normalized to 100%.
                </p>
              )}
            </div>
          </div>

          {/* Holdings Contribution Table */}
          <div className="card-premium" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              Per-Holding Risk Contributions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Ticker</th>
                    <th style={{ padding: '12px 16px' }}>Sector</th>
                    <th style={{ padding: '12px 16px' }}>Weight</th>
                    <th style={{ padding: '12px 16px' }}>Risk Score</th>
                    <th style={{ padding: '12px 16px' }}>Risk Contribution</th>
                    <th style={{ padding: '12px 16px' }}>Concentration Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.holdings.map((h) => {
                    const isFlagged = h.concentration_flag;
                    return (
                      <tr
                        key={h.ticker}
                        onClick={() => onSelectTicker && onSelectTicker(h.ticker)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isFlagged ? 'var(--status-danger-bg)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          {h.ticker}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {h.sector || 'Unknown'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {h.weight !== undefined && h.weight !== null ? `${(h.weight * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {h.hidden_risk_score} / 100
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                          {h.contribution_pct !== undefined && h.contribution_pct !== null ? `${Number(h.contribution_pct).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {isFlagged ? (
                            <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.15)', color: 'var(--status-danger)', border: '1px solid rgba(220,38,38,0.3)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                              ⚠️ Concentrated Risk
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Balanced</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Risk Contributors List */}
          {portfolioData.top_risk_contributors && portfolioData.top_risk_contributors.length > 0 && (
            <div className="card-premium" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                Top Risk Contributors
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {portfolioData.top_risk_contributors.map((c, i) => (
                  <div key={c.ticker} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1} DRIVER</span>
                      {c.concentration_flag && <span style={{ fontSize: 10, color: 'var(--status-danger)', fontWeight: 800 }}>⚠️ FLAGGED</span>}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{c.ticker}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span>Weight: {(c.weight * 100).toFixed(1)}%</span>
                      <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Contrib: {c.contribution_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reused Sector Heatmap */}
          {portfolioData.sector_summary && (
            <SectorHeatmap sectorSummary={portfolioData.sector_summary} />
          )}
        </div>
      )}
    </div>
  );
}
