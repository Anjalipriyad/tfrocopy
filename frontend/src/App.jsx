import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SearchBar from './components/SearchBar';
import PriceChart from './components/PriceChart';
import RiskGauge from './components/RiskGauge';
import RecommendationAlert from './components/RecommendationAlert';
import LoadingOverlay from './components/LoadingOverlay';
import FeatureRadar from './components/FeatureRadar';
import { WatchlistPanel, HistoryPanel } from './components/Watchlist';
import CursorGlow from './components/CursorGlow';
import ScrollReveal from './components/ScrollReveal';
import MarketRegimeBanner from './components/MarketRegimeBanner';
import ScreeningTable from './components/ScreeningTable';
import SectorHeatmap from './components/SectorHeatmap';
import StressIndexGauge from './components/StressIndexGauge';
import PortfolioBuilder from './components/PortfolioBuilder';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://topological-financial-risk-optimizer.onrender.com' : 'http://localhost:8000');
const HEADER_H = 64;

function generateMockPriceData(currentPrice, days = 60) {
  const data = [];
  const volatility = currentPrice * 0.012;
  let price = currentPrice * (1 - (Math.random() * 0.06 - 0.01));
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const drift = i < 5 ? (currentPrice - price) * 0.3 : 0;
    price += drift + (Math.random() - 0.48) * volatility;
    price = Math.max(price, currentPrice * 0.85);
    const c = parseFloat(price.toFixed(2));
    data.push({
      date: label, close: c,
      open: parseFloat((c * (1 - Math.random() * 0.004)).toFixed(2)),
      high: parseFloat((c * (1 + Math.random() * 0.007)).toFixed(2)),
      low: parseFloat((c * (1 - Math.random() * 0.007)).toFixed(2)),
    });
  }
  data[data.length - 1].close = currentPrice;
  return data;
}

function loadFromStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function riskColor(level) {
  if (!level) return 'var(--text-muted)';
  const l = level.toLowerCase();
  if (l.includes('high')) return 'var(--status-danger)';
  if (l.includes('medium')) return 'var(--gold)';
  return 'var(--status-safe)';
}

export default function App() {
  const [page, setPage] = useState(() => loadFromStorage('tfro_page', 'home'));
  const [pageKey, setPageKey] = useState(() => loadFromStorage('tfro_pageKey', 0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(() => loadFromStorage('tfro_result', null));
  const [chartData, setChartData] = useState(() => loadFromStorage('tfro_chartData', []));
  const [isRealData, setIsRealData] = useState(false);
  const [watchlist, setWatchlist] = useState(() => loadFromStorage('tfro_watchlist', []));
  const [predHistory, setPredHistory] = useState(() => loadFromStorage('tfro_history', []));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Persist result, chart data, and prediction history to localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem('tfro_result', JSON.stringify(result));
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem('tfro_chartData', JSON.stringify(chartData));
  }, [chartData]);

  useEffect(() => {
    localStorage.setItem('tfro_history', JSON.stringify(predHistory));
  }, [predHistory]);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Screener state
  const [screenerUniverse, setScreenerUniverse] = useState('NIFTY50');
  const [screenData, setScreenData] = useState(() => loadFromStorage('tfro_screenData', null));
  // Persist screener data
  useEffect(() => {
    if (screenData) {
      localStorage.setItem('tfro_screenData', JSON.stringify(screenData));
    }
  }, [screenData]);
  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Page transition
  const switchPage = (p) => {
    if (p === page) return;
    setPage(p);
    setPageKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetToHome = () => {
    setPage('home');
    // Preserve prediction data across navigation
    // (Result, chartData, and isRealData remain unchanged)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSearch = async (ticker) => {
    setIsLoading(true); setError(null); setResult(null); setChartData([]); setIsRealData(false);
    if (page !== 'home') switchPage('home');
    try {
      const [predRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/predict/${encodeURIComponent(ticker)}`),
        fetch(`${API_BASE}/history/${encodeURIComponent(ticker)}`).catch(() => ({ ok: false })),
      ]);
      if (!predRes.ok) {
        const body = await predRes.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${predRes.status})`);
      }
      const [data, histData] = await Promise.all([
        predRes.json(),
        histRes.ok ? histRes.json() : Promise.resolve(null),
      ]);
      setResult(data);
      if (histData?.data?.length > 5) { setChartData(histData.data); setIsRealData(true); }
      else { setChartData(generateMockPriceData(data.current_price)); setIsRealData(false); }
      const entry = { ticker: data.ticker, score: data.hidden_risk_score, riskLevel: data.risk_level, price: data.current_price, currency: data.currency, timestamp: new Date().toISOString() };
      setPredHistory(prev => {
        const updated = [entry, ...prev.filter(h => h.ticker !== data.ticker)].slice(0, 10);
        localStorage.setItem('tfro_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to the analysis server.');
    } finally { setIsLoading(false); }
  };

  const addToWatchlist = () => {
    if (!result) return;
    const item = { ticker: result.ticker, score: result.hidden_risk_score, riskLevel: result.risk_level, price: result.current_price, currency: result.currency };
    setWatchlist(prev => {
      const updated = [item, ...prev.filter(w => w.ticker !== result.ticker)].slice(0, 10);
      localStorage.setItem('tfro_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWatchlist = (ticker) => {
    setWatchlist(prev => {
      const updated = prev.filter(w => w.ticker !== ticker);
      localStorage.setItem('tfro_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isInWatchlist = result && watchlist.some(w => w.ticker === result.ticker);

  // Show sidebar only when dashboard has results/loading/error (not on hero)
  const showSidebar = page === 'home' && (result || isLoading || error);

  return (
    <div className="app-shell">

      {/* Scroll progress */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <div className="app-content">
        {/* Navbar */}
        <Navbar page={page} setPage={switchPage} onLogoClick={resetToHome} mobileSidebarOpen={toolsPanelOpen} setMobileSidebarOpen={setToolsPanelOpen} />

        {/* Global Market Regime Sub-Banner */}
        <div style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-subtle)', padding: '6px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MarketRegimeBanner benchmark={screenerUniverse === 'NIFTY50' ? '^NSEI' : '^GSPC'} />
        </div>

        {/* Body */}
        <div style={{ display: 'flex', maxWidth: page === 'home' && !showSidebar ? 'none' : 1400, margin: '0 auto', width: '100%' }}>
          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div className="mobile-overlay lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* Sidebar — only shown when dashboard has content */}
          {showSidebar && (
            <aside className={`${mobileSidebarOpen ? 'flex fixed z-40 w-72 shadow-xl' : 'hidden'} lg:flex sidebar-glass`}
              style={{
                flexDirection: 'column', width: mobileSidebarOpen ? 288 : 224, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: 20,
                position: mobileSidebarOpen ? 'fixed' : 'sticky', top: HEADER_H, height: `calc(100vh - ${HEADER_H}px)`, overflowY: 'auto', zIndex: mobileSidebarOpen ? 40 : 'auto'
              }}>
              {mobileSidebarOpen && (
                <button style={{ alignSelf: 'flex-end', marginBottom: 12, width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => setMobileSidebarOpen(false)} aria-label="Close sidebar">
                  <svg width="14" height="14" fill="none" stroke="var(--text-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              <WatchlistPanel watchlist={watchlist} onSelect={t => { handleSearch(t); setMobileSidebarOpen(false); }} onRemove={removeFromWatchlist} />
              <HistoryPanel history={predHistory} onSelect={t => { handleSearch(t); setMobileSidebarOpen(false); }} />
              {/* Mobile nav */}
              <div className="sm:hidden" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { id: 'home', label: 'Single Stock' },
                  { id: 'screener', label: 'Market Screener' },
                  { id: 'portfolio', label: 'Portfolio' },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => { switchPage(id); setMobileSidebarOpen(false); }}
                    style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: page === id ? 700 : 500, color: page === id ? 'var(--text-primary)' : 'var(--text-secondary)', background: page === id ? 'var(--bg-surface)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{label}</button>
                ))}
              </div>
            </aside>
          )}

          {/* Main */}
          <main key={pageKey} className="page-wrapper" style={{ flex: 1, minWidth: 0, padding: (page === 'home' && !showSidebar) ? '0' : '32px 24px 48px' }}>
            {page === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Search bar (shown when results exist) */}
                {(result || isLoading || error) && (
                  <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                  </section>
                )}

                {/* Error */}
                {error && (
                  <div className="animate-shake" style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--status-danger-bg)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--status-danger)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-danger)', marginBottom: 2 }}>Analysis Failed</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{error}</p>
                    </div>
                  </div>
                )}

                {isLoading && <LoadingOverlay />}

                {/* Results */}
                {result && !isLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Ticker header */}
                    <ScrollReveal variant="fade-up">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{result.ticker}</h2>
                          <span style={{
                            padding: '4px 12px', borderRadius: 8, background: riskColor(result.risk_level) === 'var(--status-safe)' ? 'var(--status-safe-bg)' : riskColor(result.risk_level) === 'var(--gold)' ? 'var(--gold-bg)' : 'var(--status-danger-bg)',
                            border: `1px solid ${riskColor(result.risk_level)}22`, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: riskColor(result.risk_level)
                          }}>
                            {result.risk_level} Risk
                          </span>
                        </div>

                        <button onClick={addToWatchlist}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10,
                            border: `1px solid ${isInWatchlist ? 'var(--gold-border)' : 'var(--border-default)'}`,
                            background: isInWatchlist ? 'var(--gold-bg)' : 'var(--bg-glass)',
                            color: isInWatchlist ? 'var(--gold)' : 'var(--text-secondary)',
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.25s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = isInWatchlist ? 'var(--gold-border)' : 'var(--border-default)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                          {isInWatchlist ? '✓ Watching' : '+ Watch'}
                        </button>
                      </div>
                    </ScrollReveal>

                    {/* Chart */}
                    <ScrollReveal variant="fade-up" delay={100}>
                      <PriceChart data={chartData} ticker={result.ticker} isRealData={isRealData} currency={result.currency} />
                    </ScrollReveal>

                    {/* System Inference */}
                    <ScrollReveal variant="fade-up" delay={200}>
                      <div className="card-premium">
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>System Inference</h2>
                            <p className="label-xs" style={{ marginTop: 3 }}>Topological Manifold Analysis · {result.ticker}</p>
                          </div>

                        </div>
                        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <RiskGauge score={result.hidden_risk_score} riskLevel={result.risk_level} />
                            </div>
                            <FeatureRadar features={result.features || {}} currentPrice={result.current_price} currency={result.currency} />
                          </div>
                          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                          <RecommendationAlert
                            riskLevel={result.risk_level}
                            recommendation={result.recommendation}
                            currentPrice={result.current_price}
                            currency={result.currency}
                            features={result.features || {}}
                            modelConfidence={result.model_confidence_pct}
                            historicalAccuracy={result.historical_accuracy_pct}
                          />
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                )}

                {/* Hero (empty state) */}
                {!result && !isLoading && !error && (
                  <HeroSection onSearch={handleSearch} isLoading={isLoading} />
                )}
              </div>
            )}

            {/* Market Screener View */}
            {page === 'screener' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  <StressIndexGauge universe={screenerUniverse} />
                  {screenData && screenData.sector_summary && (
                    <SectorHeatmap sectorSummary={screenData.sector_summary} />
                  )}
                </div>

                <ScreeningTable
                  onSelectTicker={(t) => handleSearch(t)}
                  onScreenDataLoaded={(data) => setScreenData(data)}
                  currentUniverse={screenerUniverse}
                  setCurrentUniverse={setScreenerUniverse}
                />
              </div>
            )}

            {/* Portfolio View */}
            {page === 'portfolio' && (
              <PortfolioBuilder onSelectTicker={(t) => handleSearch(t)} />
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="footer-glass" style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', marginTop: 'auto' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Topological Financial Risk Optimizer</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

