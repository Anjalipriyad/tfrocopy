"""
Portfolio request and response models for risk aggregation.
"""

from typing import List
from pydantic import BaseModel


class Holding(BaseModel):
    ticker: str
    weight: float


class PortfolioRequest(BaseModel):
    holdings: List[Holding]


def compute_risk_contributions(holdings: List[dict], portfolio_risk_score: float) -> List[dict]:
    """
    Computes per-holding risk contribution percentage and concentration flags.

    - raw_contribution = weight * hidden_risk_score
    - contribution_pct = (raw_contribution / sum(all raw_contributions)) * 100
    - concentration_flag = True if holding contributes disproportionately higher risk
      than its portfolio allocation weight AND represents non-trivial risk (hidden_risk_score > 30).
    """
    if not holdings:
        return []

    raw_contributions = []
    for h in holdings:
        w = float(h.get("weight", 0))
        score = float(h.get("hidden_risk_score", 0))
        raw_contributions.append(w * score)

    sum_raw = sum(raw_contributions)

    for idx, h in enumerate(holdings):
        w = float(h.get("weight", 0))
        score = float(h.get("hidden_risk_score", 0))
        weight_pct = w * 100.0
        
        if sum_raw > 0:
            contrib_pct = (raw_contributions[idx] / sum_raw) * 100.0
        else:
            contrib_pct = 0.0

        contrib_pct_rounded = round(float(contrib_pct), 1)

        # Flag if contribution is disproportionately higher than allocation weight (>1.5x weight)
        # AND stock risk score is non-trivial (>30).
        is_disproportionate = (weight_pct > 0 and contrib_pct_rounded >= (1.5 * weight_pct))
        is_high_contrib = (contrib_pct_rounded >= 40.0)
        
        is_concentrated = (score > 30) and (is_disproportionate or (is_high_contrib and score >= 40))

        h["contribution_pct"] = contrib_pct_rounded
        h["concentration_flag"] = is_concentrated

    return holdings


