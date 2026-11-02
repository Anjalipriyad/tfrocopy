import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://topological-financial-risk-optimizer.onrender.com' : 'http://localhost:8000');

function tmsiPalette(score) {
  if (score < 40) return { color: 'var(--status-safe)', bg: 'var(--status-safe-bg)', label: 'STABLE MARKET', glow: 'rgba(5,150,105,0.3)' };
  if (score < 70) return { color: 'var(--gold)', bg: 'var(--gold-bg)', label: 'ELEVATED STRESS', glow: 'var(--gold-glow)' };
  return { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)', label: 'HIGH STRESS', glow: 'rgba(220,38,38,0.3)' };
}

export default function StressIndexGauge({ universe = 'NIFTY50' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchTMSI() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/market/stress-index?universe=${encodeURIComponent(universe)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch TMSI:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTMSI();
    return () => { isMounted = false; };
  }, [universe]);

  const score = data?.current?.tmsi || 0;
  const palette = tmsiPalette(score);
  const r = 42;
  const circumference = r * 2 * Math.PI;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    if (!score) return;
    let frame;
    let start = null;
    const duration = 1000;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(parseFloat((eased * score).toFixed(1)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const historyData = (data?.history || []).map((h, i) => ({
    time: i + 1,
    tmsi: h.tmsi,
    date: h.as_of ? new Date(h.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${i}`,
  }));

  return (
    <div className="card-premium" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Topological Market Stress Index (TMSI)
        </h3>
        <p className="label-xs" style={{ marginTop: 2 }}>
          Composite Stress Indicator ({universe})
        </p>
      </div>

      {loading ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin-slow" style={{ width: 24, height: 24, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width: 190, height: 190 }}>
            <div className="animate-breathe" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, opacity: 0.5 }} />
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <defs>
                <linearGradient id="tmsiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--status-safe)" />
                  <stop offset="50%" stopColor="var(--gold)" />
                  <stop offset="100%" stopColor="var(--status-danger)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={r} stroke="var(--border-subtle)" strokeWidth="6" fill="none" />
              <circle cx="50" cy="50" r={r} stroke="url(#tmsiGrad)" strokeWidth="6" fill="none"
                strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.1s ease-out', filter: `drop-shadow(0 0 4px ${palette.glow})` }} />
            </svg>

            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>TMSI SCORE</p>
              <p style={{ fontSize: 44, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{animatedScore}</p>
              <div style={{ marginTop: 8, padding: '3px 10px', borderRadius: 16, background: palette.bg, border: `1px solid ${palette.color}33`, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: palette.color }}>
                {palette.label}
              </div>
            </div>
          </div>

          {/* Breakdown Submetrics */}
          {data?.current && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', background: 'var(--bg-surface)', padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>MEAN RISK</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{data.current.mean_risk}</p>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>DISPERSION</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{data.current.dispersion}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>HIGH RISK %</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{data.current.high_risk_share}%</p>
              </div>
            </div>
          )}

          {/* Sparkline History */}
          {historyData.length > 1 && (
            <div style={{ width: '100%', height: 70, marginTop: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>
                TMSI In-Memory Trend History ({historyData.length} runs)
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="tmsiSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: 'var(--text-primary)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                        TMSI: {d.tmsi} ({d.date})
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="tmsi" stroke="var(--gold)" strokeWidth={2} fillOpacity={1} fill="url(#tmsiSpark)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
