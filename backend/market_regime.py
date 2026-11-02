"""
Market-wide volatility regime detection module.
"""

import asyncio
from typing import Dict, Any
import numpy as np


async def get_market_regime(benchmark: str = "^GSPC") -> Dict[str, Any]:
    """
    Computes market-wide realized volatility regime for a benchmark (^GSPC or ^NSEI).

    - Pulls 1y close prices for the benchmark.
    - Computes 21-day rolling annualized realized volatility (log_returns.std(21) * sqrt(252)).
    - Classifies current volatility using self-adjusting 33rd/67th percentile thresholds.
    - Results are cached for the rest of the calendar day (regime only changes at market close).
    """
    from main import fetch_data_robust
    from backend.cache import get_cached, set_cached

    clean_benchmark = benchmark.upper().strip()
    cache_key = f"__regime__{clean_benchmark}"

    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    def _compute():
        try:
            df = fetch_data_robust(clean_benchmark, period="1y")
            if df.empty or len(df) < 30 or "Close" not in df.columns:
                return {
                    "benchmark": clean_benchmark,
                    "current_volatility_annualized": 0.0,
                    "regime": "Medium",
                    "as_of": "N/A",
                }

            closes = df["Close"]
            log_returns = np.log(closes / closes.shift(1)).dropna()
            
            # 21-day rolling annualized realized volatility
            rolling_vol = log_returns.rolling(window=21).std() * np.sqrt(252)
            rolling_vol_clean = rolling_vol.dropna()

            if rolling_vol_clean.empty:
                return {
                    "benchmark": clean_benchmark,
                    "current_volatility_annualized": 0.0,
                    "regime": "Medium",
                    "as_of": "N/A",
                }

            current_vol = float(rolling_vol_clean.iloc[-1])
            latest_idx = rolling_vol_clean.index[-1]
            try:
                as_of_str = latest_idx.strftime("%Y-%m-%d")
            except Exception:
                as_of_str = str(latest_idx)[:10]

            p33 = float(np.percentile(rolling_vol_clean, 33))
            p67 = float(np.percentile(rolling_vol_clean, 67))

            if current_vol <= p33:
                regime = "Low"
            elif current_vol < p67:
                regime = "Medium"
            else:
                regime = "High"

            return {
                "benchmark": clean_benchmark,
                "current_volatility_annualized": round(current_vol, 4),
                "regime": regime,
                "as_of": as_of_str,
            }
        except Exception:
            return {
                "benchmark": clean_benchmark,
                "current_volatility_annualized": 0.0,
                "regime": "Medium",
                "as_of": "N/A",
            }

    result = await asyncio.to_thread(_compute)
    set_cached(cache_key, result)
    return result

