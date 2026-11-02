"""
Daily inference cache for the TFRO backend.

Prices change at most once per trading day (after market close), so re-running
the full TDA + ensemble training pipeline within the same calendar day for the
same ticker produces identical results.  This cache layer:

  - Stores results in memory, keyed by (ticker_or_benchmark, date_str).
  - Automatically evicts ALL stale entries when a new calendar day is detected
    (a single O(n) sweep on first access of each day).
  - Thread-safe for asyncio usage (single-threaded event loop, no locks needed).
  - Never persists to disk — intentionally volatile so a server restart always
    gets a fresh model trained on the latest closes.

Usage
-----
from backend.cache import get_cached, set_cached, cache_stats

# Retrieve a cached value (returns None on miss / stale day)
result = get_cached("AAPL")

# Store a result after a successful inference run
set_cached("AAPL", risk_response_obj)

# Optional: surfaced by /cache/stats for observability
stats = cache_stats()
"""

from datetime import date
from typing import Any, Dict, Optional, Tuple

# ── Internal state ────────────────────────────────────────────────────────────
# Maps ticker/key -> (date_str, payload)
_CACHE: Dict[str, Tuple[str, Any]] = {}

# The calendar date we last wrote to the cache.
# Used for bulk-eviction when the day rolls over.
_CACHE_DATE: Optional[str] = None


def _today() -> str:
    """Return today's date as an ISO-8601 string (e.g. '2026-09-13')."""
    return date.today().isoformat()


def _evict_stale() -> int:
    """
    If the calendar day has changed since the last write, purge every entry
    that belongs to a previous day.  Returns the number of entries evicted.
    """
    global _CACHE_DATE

    today = _today()
    if _CACHE_DATE == today:
        return 0  # Still the same day — nothing to do.

    # Day has rolled: drop all stale entries in one pass.
    stale_keys = [k for k, (d, _) in _CACHE.items() if d != today]
    for k in stale_keys:
        del _CACHE[k]

    _CACHE_DATE = today
    return len(stale_keys)


# ── Public API ────────────────────────────────────────────────────────────────

def get_cached(key: str) -> Optional[Any]:
    """
    Return the cached payload for *key* if it was stored today, else None.

    Parameters
    ----------
    key : str
        Typically a ticker symbol (e.g. "AAPL") or a benchmark (e.g. "^GSPC").
        Always normalised to upper-case by the caller.
    """
    _evict_stale()

    entry = _CACHE.get(key.upper())
    if entry is None:
        return None

    stored_date, payload = entry
    if stored_date != _today():
        # This individual entry is from a previous day (edge case: _evict_stale
        # already cleaned up, but guard anyway).
        del _CACHE[key.upper()]
        return None

    return payload


def set_cached(key: str, value: Any) -> None:
    """
    Store *value* in the cache under *key*, tagged with today's date.

    Parameters
    ----------
    key   : ticker or benchmark string (normalised to upper-case internally).
    value : Any serialisable object — typically a RiskResponse or regime dict.
    """
    _evict_stale()
    _CACHE[key.upper()] = (_today(), value)


def invalidate(key: str) -> bool:
    """
    Explicitly remove a single key (e.g. forced refresh for one ticker).
    Returns True if the key was present, False otherwise.
    """
    return _CACHE.pop(key.upper(), None) is not None


def invalidate_all() -> int:
    """Flush the entire cache.  Returns the number of entries cleared."""
    count = len(_CACHE)
    _CACHE.clear()
    return count


def cache_stats() -> Dict[str, Any]:
    """
    Return a lightweight stats dict for the /cache/stats observability endpoint.
    """
    _evict_stale()
    return {
        "cached_keys": sorted(_CACHE.keys()),
        "entry_count": len(_CACHE),
        "cache_date": _CACHE_DATE or _today(),
    }
