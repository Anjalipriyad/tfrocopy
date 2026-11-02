import { useState, useEffect } from 'react';
import MagneticButton from './MagneticButton';

/**
 * Navbar — Premium glassmorphism navigation.
 * Scroll-aware: strengthens glass tint after scrolling 50px.
 * Logo navigates to Home. Animated gold underline on active tab.
 */
export default function Navbar({ page, setPage, onLogoClick, mobileSidebarOpen, setMobileSidebarOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tabs = [
    { id: 'home', label: 'Single Stock', icon: '◈' },
    { id: 'screener', label: 'Market Screener', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  ];


  return (
    <header
      className={`glass-nav ${scrolled ? 'scrolled' : ''}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
      }}
    >
      <div style={{
        height: '100%',
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* Logo */}
        <button
          onClick={() => {
            if (onLogoClick) onLogoClick();
            else setPage('home');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            padding: '4px 0',
          }}
          aria-label="Go to Home"
        >
          {/* Logo mark */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(212, 168, 67, 0.25)',
            transition: 'transform 0.3s var(--ease-spring), box-shadow 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) rotate(-3deg)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 168, 67, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(212, 168, 67, 0.25)';
          }}
          >
            <span style={{
              color: 'white',
              fontSize: 14,
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}>
              TF
            </span>
          </div>

          {/* Logo text */}
          <div>
            <h1 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              fontFamily: 'var(--font-display)',
            }}>
              TFRO
            </h1>
            <p style={{
              fontSize: 10,
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              marginTop: 1,
            }}>
              Risk Optimizer
            </p>
          </div>
        </button>

        {/* Tab navigation */}
        <nav
          className="hidden sm:flex"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid var(--border-subtle)',
          }}
        >
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                fontSize: 12,
                fontWeight: page === id ? 700 : 500,
                fontFamily: 'var(--font-display)',
                color: page === id ? 'white' : 'var(--text-secondary)',
                background: page === id
                  ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)'
                  : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.3s var(--ease-smooth)',
                boxShadow: page === id ? '0 2px 12px rgba(212, 168, 67, 0.3)' : 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                if (page !== id) {
                  e.currentTarget.style.background = 'rgba(26, 26, 46, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: 11 }}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Live indicator */}
          <div
            className="hidden sm:flex"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'var(--gold-bg)',
              borderRadius: 20,
              border: '1px solid var(--gold-border)',
            }}
          >
            <div
              className="animate-breathe"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--gold)',
                boxShadow: '0 0 8px var(--gold-glow)',
              }}
            />
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gold)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Engine Live
            </span>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setMobileSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" fill="none" stroke="var(--text-primary)" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
