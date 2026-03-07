from __future__ import annotations
from typing import TypedDict, List, Optional
import numpy as np

class HydrographPoint(TypedDict):
    time: float
    discharge: float

class HSSNakayasuOutput(TypedDict):
    Qp: float
    Tp: float
    Tb: float
    hydrograph: List[HydrographPoint]

def hss_nakayasu(Ro: float, Tg: Optional[float], Tr: float, Alpha: float, A: float, L: float) -> HSSNakayasuOutput:
    """
    HSS Nakayasu - Perhitungan Hidrograf Satuan Sintetik
    Sesuai SNI 2415:2016 Pasal 6.3
    """
    # Perhitungan Tg otomatis jika tidak diinput atau 0
    Tg_calc = 0.4 + 0.058 * L
    Tg_used = Tg if Tg and Tg > 0 else Tg_calc
    
    Tp = Tg_used + 0.8 * Tr
    T03 = Alpha * Tg_used
    
    # Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03))
    Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03))
    Tb = Tp + 2.5 * T03
    
    hydrograph: List[HydrographPoint] = []
    time_step = 0.1
    max_time = Tb + 2 * T03
    
    # Generate hydrograph
    # t=0: Q=0
    # 0 < t <= Tp: Q = Qp * (t/Tp)^2.4
    # Tp < t <= Tp+T03: Q = Qp * 0.3^((t-Tp)/T03)
    # Tp+T03 < t <= Tp+T03+1.5*T03: Q = Qp * 0.3^(1 + (t-Tp-T03)/(1.5*T03))
    # t > Tp+2.5*T03: Q = Qp * 0.3^(2.5 + (t-Tp-2.5*T03)/(2*T03))
    
    t = 0.0
    while t <= max_time + 0.0001:
        Q = 0.0
        if t == 0:
            Q = 0.0
        elif 0 < t <= Tp:
            Q = Qp * (t / Tp) ** 2.4
        elif Tp < t <= Tp + T03:
            Q = Qp * (0.3 ** ((t - Tp) / T03))
        elif Tp + T03 < t <= Tp + 2.5 * T03:
            # Note: TS source says Tp + T03 + 1.5 * T03 which is Tp + 2.5 * T03
            Q = Qp * (0.3 ** (1 + (t - Tp - T03) / (1.5 * T03)))
        elif t > Tp + 2.5 * T03:
            Q = Qp * (0.3 ** (2.5 + (t - Tp - 2.5 * T03) / (2 * T03)))
            
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
