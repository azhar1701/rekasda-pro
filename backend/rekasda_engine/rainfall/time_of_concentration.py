from __future__ import annotations
import numpy as np
from typing import Dict, Any

def kirpich(L: float, S: float) -> float:
    """
    Rumus Kirpich (SNI 2415:2016)
    Formula: Tc = 0.0195 * (L * 1000)^0.77 * S^(-0.385)
    L in km, result in minutes
    """
    if L <= 0 or S <= 0:
        return 0.0
    return 0.0195 * np.pow(L * 1000, 0.77) * np.pow(S, -0.385)

def bransby_williams(L: float, A: float, S: float) -> float:
    """
    Rumus Bransby-Williams
    Formula: Tc = 58.5 * L / (A^0.1 * S^0.2)
    L in km, A in km2, result in minutes
    """
    if L <= 0 or A <= 0 or S <= 0:
        return 0.0
    return (58.5 * L) / (np.pow(A, 0.1) * np.pow(S, 0.2))

def california_culvert(L: float, H: float) -> float:
    """
    Rumus California Culvert Practice
    Formula: Tc = (0.87 * L^3 / H)^0.385
    L in km, H in m, result in hours
    """
    if L <= 0 or H <= 0:
        return 0.0
    return np.pow((0.87 * np.pow(L, 3)) / H, 0.385)

def time_of_concentration(method: str, **kwargs: Any) -> Dict[str, Any]:
    """
    Dispatcher returning dict with method, tc_minutes, tc_hours
    """
    L = kwargs.get('L', 0.0)
    S = kwargs.get('S', 0.0)
    A = kwargs.get('A', 0.0)
    H = kwargs.get('H', 0.0)
    
    tc_minutes = 0.0
    
    if method == 'kirpich':
        tc_minutes = kirpich(L, S)
    elif method == 'bransby-williams':
        tc_minutes = bransby_williams(L, A, S)
    elif method == 'california':
        # If H is not provided, estimate it from L and S as in TS
        if H <= 0 and S > 0:
            H = L * 1000 * S
        tc_hours = california_culvert(L, H)
        tc_minutes = tc_hours * 60
    else:
        # Default to Kirpich as in TS
        tc_minutes = kirpich(L, S)
        
    return {
        'method': method,
        'tc_minutes': round(tc_minutes, 2),
        'tc_hours': round(tc_minutes / 60, 4)
    }
