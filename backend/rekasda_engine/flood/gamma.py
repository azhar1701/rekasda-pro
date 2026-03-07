from __future__ import annotations
from typing import TypedDict, List, Optional
import numpy as np

class HydrographPoint(TypedDict):
    time: float
    discharge: float

class HSSGammaOutput(TypedDict):
    Qp: float
    Tp: float
    Tb: float
    hydrograph: List[HydrographPoint]

def hss_gamma(Ro: float, A: float, L: float, Tc: Optional[float] = None) -> HSSGammaOutput:
    """
    HSS Gamma I - Perhitungan Hidrograf Satuan Sintetik
    Metode Sri Harto (1993)
    """
    # Tc = 0.43 * (L / sqrt(S))^0.467 (asumsi slope 0.01)
    Tc_used = Tc if Tc and Tc > 0 else 0.43 * ((L / np.sqrt(0.01)) ** 0.467)
    Tp = 0.5 * Tc_used
    Qp = (0.18 * A * Ro) / Tp
    Tb = 3 * Tp
    
    hydrograph: List[HydrographPoint] = []
    time_step = 0.1
    max_time = Tb + Tp
    
    t = 0.0
    while t <= max_time + 0.0001:
        Q = 0.0
        if t == 0:
            Q = 0.0
        elif 0 < t <= Tp:
            Q = Qp * (t / Tp) ** 2.5
        elif Tp < t <= Tb:
            Q = Qp * ((Tb - t) / (Tb - Tp)) ** 1.5
            
        hydrograph.append({
            "time": round(float(t), 2),
            "discharge": round(float(Q), 4)
        })
        t += time_step
        
    return {
        "Qp": round(float(Qp), 3),
        "Tp": round(float(Tp), 2),
        "Tb": round(float(Tb), 2),
        "hydrograph": hydrograph
    }
