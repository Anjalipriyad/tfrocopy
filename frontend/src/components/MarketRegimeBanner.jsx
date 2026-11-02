import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://topological-financial-risk-optimizer.onrender.com' : 'http://localhost:8000');

export default function MarketRegimeBanner({ benchmark = '^GSPC' }) {
  const [regimeData, setRegimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRegime() {
      try {
        const res = await fetch(`${API_BASE}/market/regime?benchmark=${encodeURIComponent(benchmark)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRegimeData(data);
        }
      } catch (err) {
        console.error('Failed to fetch market regime:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRegime();
    return () => { isMounted = false; };
  }, [benchmark]);

  if (loading) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
        <div className="animate-spin-slow" style={{ width: 12, height: 12, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Loading Regime...</span>
      </div>
    );
  }

  if (!regimeData) return null;

  const regime = regimeData.regime || 'Medium';
  const volPct = (regimeData.current_volatility_annualized * 100).toFixed(1);

  const getTheme = (reg) => {
    const r = reg.toLowerCase();
    if (r === 'high') return { bg: 'var(--status-danger-bg)', border: 'rgba(220,38,38,0.2)', text: 'var(--status-danger)', dot: 'var(--status-danger)' };
    if (r === 'low') return { bg: 'var(--status-safe-bg)', border: 'rgba(5,150,105,0.2)', text: 'var(--status-safe)', dot: 'var(--status-safe)' };
    return { bg: 'var(--gold-bg)', border: 'var(--gold-border)', text: 'var(--gold)', dot: 'var(--gold)' };
  };

  const theme = getTheme(regime);

  return (
    <div
      title={`Annualized Realized Volatility: ${volPct}% (${regimeData.benchmark} as of ${regimeData.as_of})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 20,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        cursor: 'help',
        transition: 'all 0.3s var(--ease-smooth)',
      }}
    >
      <div
        className="animate-breathe"
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: theme.dot,
          boxShadow: `0 0 8px ${theme.dot}`,
        }}
      />
      <span style={{ fontSize: 11, fontWeight: 800, color: theme.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {regime} Volatility Regime
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
        ({volPct}% Vol)
      </span>
    </div>
  );
}
