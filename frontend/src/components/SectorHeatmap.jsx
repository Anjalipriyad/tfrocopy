import React from 'react';

function getRiskColor(score) {
  if (score > 70) return { bg: 'var(--status-danger-bg)', border: 'rgba(220,38,38,0.25)', text: 'var(--status-danger)', bar: 'var(--status-danger)' };
  if (score >= 40) return { bg: 'var(--gold-bg)', border: 'var(--gold-border)', text: 'var(--gold)', bar: 'var(--gold)' };
  return { bg: 'var(--status-safe-bg)', border: 'rgba(5,150,105,0.25)', text: 'var(--status-safe)', bar: 'var(--status-safe)' };
}

export default function SectorHeatmap({ sectorSummary = [] }) {
  if (!sectorSummary || sectorSummary.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No sector summary available.</p>
      </div>
    );
  }

  const sortedSummary = [...sectorSummary].sort((a, b) => a.sector_rank - b.sector_rank);

  return (
    <div className="card-premium" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Sector Risk Heatmap
          </h3>
          <p className="label-xs" style={{ marginTop: 2 }}>
            Cross-Sectional Sector Stress & Allocation
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 8, background: 'var(--bg-surface)' }}>
          {sortedSummary.length} Sectors Analyzed
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {sortedSummary.map((sec) => {
          const score = sec.weighted_risk_score !== undefined ? sec.weighted_risk_score : sec.avg_risk_score;
          const theme = getRiskColor(score);
          const percentVal = Math.min(100, Math.max(0, score));

          return (
            <div
              key={sec.sector}
              style={{
                padding: '16px',
                borderRadius: 14,
                background: 'white',
                border: `1px solid ${theme.border}`,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s var(--ease-smooth)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Background indicator bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  background: theme.bar,
                }}
              />

              <div style={{ paddingLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    RANK #{sec.sector_rank}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: theme.bg,
                      color: theme.text,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {score} / 100
                  </span>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {sec.sector}
                </h4>

                {/* Progress Bar */}
                <div style={{ height: 6, width: '100%', background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percentVal}%`,
                      background: theme.bar,
                      borderRadius: 3,
                      transition: 'width 0.6s var(--ease-out)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{sec.stock_count} {sec.stock_count === 1 ? 'Stock' : 'Stocks'}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {sec.tickers.slice(0, 4).join(', ')}{sec.tickers.length > 4 ? ` +${sec.tickers.length - 4}` : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
