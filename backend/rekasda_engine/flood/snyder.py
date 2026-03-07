from __future__ import annotations
from typing import TypedDict, List, Optional
import numpy as np

class HydrographPoint(TypedDict):
    time: float
    discharge: float

class HSSSnyderOutput(TypedDict):
    Qp: float
    Tp: float
    Tb: float
    tpR: float
    hydrograph: List[HydrographPoint]

def hss_snyder(Ro: float, A: float, L: float, Lc: float, Ct: float, Cp: float) -> HSSSnyderOutput:
    """
    HSS Snyder - Perhitungan Hidrograf Satuan Sintetik
    Metode Snyder (1938)
    """
    tpR = Ct * (L * Lc) ** 0.3
    tr = tpR / 5.5
    Tp = tpR + 0.25 * tr
    Qp = (2.78 * Cp * A * Ro) / Tp
    Tb = 5 * Tp
    
    hydrograph: List[HydrographPoint] = []
    time_step = 0.1
    max_time = Tb + Tp
    
    t = 0.0
    while t <= max_time + 0.0001:
        Q = 0.0
        if t == 0:
            Q = 0.0
        elif 0 < t <= Tp:
            Q = Qp * (t / Tp) ** 2.0
        elif Tp < t <= Tb:
            Q = Qp * ((Tb - t) / (Tb - Tp)) ** 1.2
            
        hydrograph.append({
            "time": round(float(t), 2),
            "discharge": round(float(Q), 4)
        })
        t += time_step
        
    return {
        "Qp": round(float(Qp), 3),
        "Tp": round(float(Tp), 2),
        "Tb": round(float(Tb), 2),
        "tpR": round(float(tpR), 3),
        "hydrograph": hydrograph
    }
