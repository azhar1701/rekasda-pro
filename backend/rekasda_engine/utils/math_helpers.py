from __future__ import annotations
import numpy as np
from scipy import stats
from typing import Dict, List, Optional

def interpolate_table(table: Dict[int, float], n: int) -> float:
    """Linear interpolation for statistical tables based on sample size n."""
    keys = sorted(table.keys())
    if not keys:
        return 0.0
    if n <= keys[0]:
        return table[keys[0]]
    if n >= keys[-1]:
        return table[keys[-1]]
    
    for i in range(len(keys) - 1):
        if keys[i] <= n <= keys[i+1]:
            x1, x2 = keys[i], keys[i+1]
            y1, y2 = table[x1], table[x2]
            return y1 + ((y2 - y1) / (x2 - x1)) * (n - x1)
    return table[keys[-1]]

def interpolate_log_pearson_k(cs: float, return_period: int, table: Dict[str, Dict[int, float]]) -> float:
    """Interpolate K value for Log-Pearson III based on skewness Cs and return period."""
    cs_keys = sorted([float(k) for k in table.keys()])
    
    # Clamp to table bounds
    if cs <= cs_keys[0]:
        return table[f"{cs_keys[0]:.1f}"][return_period]
    if cs >= cs_keys[-1]:
        return table[f"{cs_keys[-1]:.1f}"][return_period]
        
    for i in range(len(cs_keys) - 1):
        if cs_keys[i] <= cs <= cs_keys[i+1]:
            c1, c2 = cs_keys[i], cs_keys[i+1]
            k1 = table[f"{c1:.1f}"][return_period]
            k2 = table[f"{c2:.1f}"][return_period]
            return k1 + ((k2 - k1) / (c2 - c1)) * (cs - c1)
    return 0.0

def calculate_statistical_params(data: List[float]) -> dict:
    """Calculate mean, std_dev, Cv, Cs, Ck with SNI/WMO formulas."""
    n = len(data)
    if n < 2:
        return {"mean": 0, "std_dev": 0, "cv": 0, "cs": 0, "ck": 0, "n": n}
        
    data_np = np.array(data)
    mean = np.mean(data_np)
    
    # Sample standard deviation (n-1)
    std_dev = np.std(data_np, ddof=1)
    cv = std_dev / mean if mean != 0 else 0
    
    # Moments for skewness and kurtosis
    m2 = np.sum((data_np - mean)**2) / n
    m3 = np.sum((data_np - mean)**3) / n
    m4 = np.sum((data_np - mean)**4) / n
    
    # SNI formulas for Cs and Ck (unbiased estimators)
    if n > 2 and std_dev > 0:
        cs = (n * m3) / ((n - 1) * (n - 2) * (std_dev**3))
    else:
        cs = 0
        
    if n > 3 and std_dev > 0:
        # Fisher-Pearson kurtosis
        ck = (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * (std_dev**4)) - (3 * (n - 1)**2) / ((n - 2) * (n - 3))
    else:
        ck = 0
        
    return {
        "mean": float(mean),
        "std_dev": float(std_dev),
        "cv": float(cv),
        "cs": float(cs),
        "ck": float(ck),
        "n": n
    }

def normal_cdf(z: float) -> float:
    """Standard Normal Cumulative Distribution Function."""
    return stats.norm.cdf(z)

def gumbel_cdf(x: float, mean: float, std_dev: float) -> float:
    """Gumbel Cumulative Distribution Function."""
    # alpha = 1.2825 / std_dev (approx) but SNI uses Yn/Sn approach
    # Here we use the standard definition for CDF check
    alpha = np.pi / (np.sqrt(6) * std_dev)
    u = mean - (0.5772 / alpha)
    return np.exp(-np.exp(-alpha * (x - u)))
