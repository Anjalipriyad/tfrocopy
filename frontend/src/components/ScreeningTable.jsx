import React, { useState, useEffect } from 'react';
import LoadingOverlay from './LoadingOverlay';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://topological-financial-risk-optimizer.onrender.com' : 'http://localhost:8000');

function riskBadgeStyle(score) {
  if (score > 70) return { bg: 'var(--status-danger-bg)', text: 'var(--status-danger)', border: 'rgba(220,38,38,0.25)', label: 'High' };
  if (score >= 40) return { bg: 'var(--gold-bg)', text: 'var(--gold)', border: 'var(--gold-border)', label: 'Medium' };
  return { bg: 'var(--status-safe-bg)', text: 'var(--status-safe)', border: 'rgba(5,150,105,0.25)', label: 'Low' };
}

export default function ScreeningTable({ onSelectTicker, onScreenDataLoaded, currentUniverse, setCurrentUniverse }) {
  const [universe, setUniverse] = useState(currentUniverse || 'NIFTY50');
  const [customTickers, setCustomTickers] = useState('AAPL, NVDA, TSLA, MSFT, AMZN');
  const [screenData, setScreenData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Sort state
  const [sortField, setSortField] = useState('calibrated_risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchScreen = async (selectedUniverse, tickersInput) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/screen?universe=${encodeURIComponent(selectedUniverse)}`;
      if (selectedUniverse === 'CUSTOM') {
        url += `&tickers=${encodeURIComponent(tickersInput)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Screening failed (${res.status})`);
      }
      const json = await res.json();
      setScreenData(json);
      if (setCurrentUniverse) setCurrentUniverse(selectedUniverse);
      if (onScreenDataLoaded) onScreenDataLoaded(json);
    } catch (err) {
      setError(err.message || 'Failed to complete market screen.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScreen(universe, customTickers);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchScreen(universe, customTickers);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortedResults = () => {
    if (!screenData?.results) return [];
    return [...screenData.results].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === null || valA === undefined) valA = -999;
      if (valB === null || valB === undefined) valB = -999;
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB).toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  };

  const sortedResults = getSortedResults();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Search & Controls Header */}
      <div className="card-premium" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Market Universe Screener
              </h2>
              <p className="label-xs" style={{ marginTop: 2 }}>
                Non-Euclidean Early Warning Scanner
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Universe Dropdown */}
              <select
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="NIFTY50">NIFTY 50 (India)</option>
                <option value="SP500">S&P 500 (US)</option>
                <option value="CUSTOM">Custom Stock List</option>
              </select>

              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Scanning...' : 'Execute Screen'}
              </button>
            </div>
          </div>

          {/* Custom tickers input */}
          {universe === 'CUSTOM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Enter Comma-Separated Tickers:
              </label>
              <input
                type="text"
                value={customTickers}
                onChange={(e) => setCustomTickers(e.target.value)}
                placeholder="AAPL, NVDA, TSLA, MSFT, RELIANCE.NS"
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </form>
      </div>

      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--status-danger-bg)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--status-danger)', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {isLoading && <LoadingOverlay message="Executing topological manifold inference across universe..." />}

      {screenData && !isLoading && (
        <div className="card-premium" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Screened {screenData.results.length} Stocks ({screenData.universe})
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Click any row for full topological breakdown
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {[
                    { key: 'rank', label: 'Rank' },
                    { key: 'ticker', label: 'Ticker' },
                    { key: 'sector', label: 'Sector' },
                    { key: 'hidden_risk_score', label: 'Raw Score' },
                    { key: 'calibrated_risk_score', label: 'Calibrated Score' },
                    { key: 'percentile_rank', label: 'Percentile' },
                    { key: 'hidden_risk_score', label: 'Risk Level' },
                    { key: 'model_confidence_pct', label: 'Confidence' },
                  ].map((col, idx) => (
                    <th
                      key={idx}
                      onClick={() => handleSort(col.key)}
                      style={{ padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.label}
                        {sortField === col.key && (
                          <span style={{ color: 'var(--gold)' }}>{sortAsc ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((item, idx) => {
                  const badge = riskBadgeStyle(item.hidden_risk_score);
                  return (
                    <tr
                      key={item.ticker}
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {item.ticker}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {item.sector || 'Unknown'}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {item.hidden_risk_score} / 100
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                        {item.calibrated_risk_score !== null && item.calibrated_risk_score !== undefined ? `${item.calibrated_risk_score}` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {item.percentile_rank !== null && item.percentile_rank !== undefined ? `${item.percentile_rank}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 8, background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {item.model_confidence_pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
