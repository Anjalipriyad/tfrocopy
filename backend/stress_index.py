"""
Topological Market Stress Index (TMSI) composite calculation module.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
import numpy as np


def compute_tmsi(screening_results: List[Dict[str, Any]], market_regime: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes the Topological Market Stress Index (TMSI) composite score (0-100).

    COMPOSITE WEIGHTING HEURISTIC:
    tmsi = clip(0.4 * mean_risk + 0.3 * min(dispersion * 2, 100) + 0.3 * high_risk_share, 0, 100)

    NOTE ON METHODOLOGY:
    The weighting (0.4 mean risk / 0.3 dispersion / 0.3 high-risk share) is a starting
    composite heuristic designed to capture both average market vulnerability and 
    risk broadening/clustering across assets. It is a domain heuristic, not a fitted/calibrated ML model.
    """
    if not screening_results:
        return {
            "tmsi": 0.0,
            "mean_risk": 0.0,
            "dispersion": 0.0,
            "high_risk_share": 0.0,
            "regime_volatility": float(market_regime.get("current_volatility_annualized", 0.0)),
            "as_of": datetime.now(timezone.utc).isoformat(),
            "universe_size": 0,
        }

    scores = []
    high_risk_count = 0

    for item in screening_results:
        if isinstance(item, dict):
            s = float(item.get("hidden_risk_score", 0))
            rl = str(item.get("risk_level", "")).upper()
        else:
            s = float(getattr(item, "hidden_risk_score", 0))
            rl = str(getattr(item, "risk_level", "")).upper()

        scores.append(s)
        if rl == "HIGH" or s > 70:
            high_risk_count += 1

    scores_arr = np.array(scores, dtype=float)
    u_size = len(scores_arr)

    mean_risk = float(np.mean(scores_arr)) if u_size > 0 else 0.0
    dispersion = float(np.std(scores_arr)) if u_size > 0 else 0.0
    high_risk_share = float((high_risk_count / u_size) * 100.0) if u_size > 0 else 0.0
    regime_vol = float(market_regime.get("current_volatility_annualized", 0.0))

    # Scale dispersion (std dev * 2 capped at 100)
    dispersion_scaled = min(dispersion * 2.0, 100.0)

    # Heuristic composite formula
    raw_tmsi = 0.4 * mean_risk + 0.3 * dispersion_scaled + 0.3 * high_risk_share
    tmsi = float(np.clip(raw_tmsi, 0.0, 100.0))

    return {
        "tmsi": round(tmsi, 1),
        "mean_risk": round(mean_risk, 1),
        "dispersion": round(dispersion, 1),
        "high_risk_share": round(high_risk_share, 1),
        "regime_volatility": round(regime_vol, 4),
        "as_of": datetime.now(timezone.utc).isoformat(),
        "universe_size": u_size,
    }
