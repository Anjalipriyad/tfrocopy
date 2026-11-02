"""
Cross-sectional score calibration module for batch screening.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd


def calibrate_scores(results: List[Any]) -> List[Dict[str, Any]]:
    """
    Calibrates stock-level hidden risk scores cross-sectionally across a screening batch.

    CRITICAL NOTE:
    Calibration is batch-relative (only meaningful within a single screening run
    or same universe). It is NOT a global fixed scale — calibrated_risk_score values
    are directly comparable within the same batch result, but should NOT be directly
    compared across separate /screen calls executed days apart or on different universes.

    Computes:
    - percentile_rank: Percentile (0-100) of hidden_risk_score within the batch.
    - z_score: Standardized z-score relative to the batch mean and std.
    - calibrated_risk_score: Min-max rescaled score (0-100) within the batch.
    """
    if not results:
        return []

    calibrated_list: List[Dict[str, Any]] = []
    scores: List[float] = []

    for item in results:
        if hasattr(item, "model_dump"):
            item_dict = item.model_dump()
        elif hasattr(item, "dict"):
            item_dict = item.dict()
        else:
            item_dict = dict(item)
        
        calibrated_list.append(item_dict)
        scores.append(float(item_dict.get("hidden_risk_score", 0)))

    scores_arr = np.array(scores, dtype=float)
    n = len(scores_arr)

    mean_val = float(np.mean(scores_arr))
    std_val = float(np.std(scores_arr))
    min_val = float(np.min(scores_arr))
    max_val = float(np.max(scores_arr))

    # Compute percentile rank (0-100)
    if n > 0:
        pct_ranks = pd.Series(scores_arr).rank(pct=True).values * 100.0
    else:
        pct_ranks = np.zeros(n)

    for i in range(n):
        s = scores_arr[i]
        
        # Z-score
        z = (s - mean_val) / std_val if std_val > 0 else 0.0

        # Min-max rescaled score (0-100)
        if max_val > min_val:
            calibrated_score = ((s - min_val) / (max_val - min_val)) * 100.0
        else:
            calibrated_score = float(s)

        calibrated_list[i]["percentile_rank"] = round(float(pct_ranks[i]), 1)
        calibrated_list[i]["z_score"] = round(float(z), 2)
        calibrated_list[i]["calibrated_risk_score"] = round(float(calibrated_score), 1)

    return calibrated_list
