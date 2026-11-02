"""
Sector metadata fetching and sector-grouped risk aggregation module.
"""

import asyncio
from typing import List, Dict, Any, Optional
import yfinance as yf

# Module-level cache for ticker -> sector mappings
_SECTOR_CACHE: Dict[str, str] = {}


async def get_sector(ticker: str) -> str:
    """
    Fetches the sector string for a given ticker symbol using yfinance metadata.
    Caches results in _SECTOR_CACHE to avoid redundant network calls.
    Returns 'Unknown' on failure or if sector data is missing.
    """
    clean_ticker = ticker.upper().strip()
    if clean_ticker in _SECTOR_CACHE:
        return _SECTOR_CACHE[clean_ticker]

    def _fetch():
        try:
            t = yf.Ticker(clean_ticker)
            sec = getattr(t, "info", {}).get("sector")
            if sec and isinstance(sec, str) and sec.strip():
                return sec.strip()
        except Exception:
            pass
        return "Unknown"

    sector_name = await asyncio.to_thread(_fetch)
    _SECTOR_CACHE[clean_ticker] = sector_name
    return sector_name


def aggregate_by_sector(items: List[Dict[str, Any]], weight_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Groups a list of stock/holding dictionaries by sector and computes:
    - avg_risk_score: Unweighted mean hidden_risk_score in the sector.
    - weighted_risk_score: Weight-normalized mean hidden_risk_score in the sector (if weight_key provided).
    - stock_count: Number of stocks in the sector.
    - tickers: List of ticker strings.
    - sector_rank: 1-indexed rank sorted by weighted_risk_score descending.
    """
    if not items:
        return []

    sector_groups: Dict[str, List[Dict[str, Any]]] = {}
    for item in items:
        sec = item.get("sector") or "Unknown"
        if sec not in sector_groups:
            sector_groups[sec] = []
        sector_groups[sec].append(item)

    summaries: List[Dict[str, Any]] = []

    for sec_name, group in sector_groups.items():
        tickers_list = [g.get("ticker", "") for g in group]
        scores = [float(g.get("hidden_risk_score", 0)) for g in group]
        stock_cnt = len(group)
        avg_score = round(float(sum(scores) / stock_cnt), 1) if stock_cnt > 0 else 0.0

        if weight_key:
            weights = [float(g.get(weight_key, 0)) for g in group]
            weight_sum = sum(weights)
            if weight_sum > 0:
                weighted_sum = sum(w * s for w, s in zip(weights, scores))
                weighted_score = round(float(weighted_sum / weight_sum), 1)
            else:
                weighted_score = avg_score
        else:
            weighted_score = avg_score

        summaries.append({
            "sector": sec_name,
            "avg_risk_score": avg_score,
            "weighted_risk_score": weighted_score,
            "stock_count": stock_cnt,
            "tickers": tickers_list,
        })

    # Sort by weighted_risk_score descending
    summaries.sort(key=lambda x: x["weighted_risk_score"], reverse=True)

    # Assign 1-indexed sector_rank
    for rank, sec_dict in enumerate(summaries, start=1):
        sec_dict["sector_rank"] = rank

    return summaries
