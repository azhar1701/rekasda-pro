from __future__ import annotations
from typing import TypedDict, List, Optional, Literal, Any
import numpy as np

class ModifiedRationalResult(TypedDict):
    method: Literal['HASPERS_OSUGI', 'DER_WEDUWEN', 'MELCHIOR']
    qPeak: float
    tc: float
    alpha: Optional[float]
    beta: Optional[float]
    C: float
    intensity: float
    warnings: List[str]
    metadata: dict[str, Any]

def haspers_osugi(A: float, L: float, S: float, R24: float) -> ModifiedRationalResult:
    """
    Metode Haspers & Osugi (Indonesia)
    Cocok untuk: A > 3 km2
    """
    warnings = []
    if A <= 3:
        warnings.append("Area terlalu kecil untuk Haspers & Osugi. Gunakan Metode Rasional Standar.")
    
    # 1. Waktu konsentrasi (jam) - Formula Haspers
    tc = 0.1 * (L ** 0.8) * (S ** -0.3)
    if not np.isfinite(tc) or tc < 0.01:
        tc = 0.01
        
    # 2. Koefisien reduksi beta (Haspers)
    beta = 1 / (1 + tc**2 + 10 * tc)
    
    # 3. Koefisien limpasan alpha (Osugi modification)
    alpha = beta * (120 / (120 + A))
    
    # 4. Intensitas hujan (mm/jam) - Mononobe
    intensity = (R24 / 24) * ((24 / tc) ** (2/3))
    
    # 5. Debit puncak (m3/s)
    q_peak = (alpha * intensity * A) / 3.6
    
    return {
        "method": "HASPERS_OSUGI",
        "qPeak": round(float(q_peak), 3),
        "tc": round(float(tc), 3),
        "alpha": round(float(alpha), 4),
        "beta": round(float(beta), 4),
        "C": round(float(alpha), 4),
        "intensity": round(float(intensity), 3),
        "warnings": warnings,
        "metadata": {
            "areaCategory": "Small-Medium" if A <= 100 else "Large",
            "formula": "Qp = alpha * I * A / 3.6, dimana alpha = beta * (120/(120+A))"
        }
    }

def der_weduwen(A: float, L: float, S: float, R24: float) -> ModifiedRationalResult:
    """
    Metode der Weduwen (Indonesia)
    Cocok untuk: 3 < A < 100 km2
    """
    warnings = []
    MAX_ITERATIONS = 20
    TOLERANCE = 0.001
    
    if A <= 3:
        warnings.append("Area terlalu kecil. Gunakan Metode Rasional Standar.")
    if A > 100:
        warnings.append("Area terlalu besar untuk der Weduwen. Pertimbangkan Metode Melchior.")
        
    # 1. Initial guess untuk tc (jam)
    tc_initial = 0.167 * (L ** 0.77) * (S ** -0.385)
    tc = tc_initial
    if not np.isfinite(tc) or tc < 0.01:
        tc = 0.01
        
    C = 0.5
    prev_C = 0.0
    iterations = 0
    
    # 2. Iterasi untuk mencari C yang konvergen
    while abs(C - prev_C) > TOLERANCE and iterations < MAX_ITERATIONS:
        prev_C = C
        # Formula der Weduwen untuk C
        C = 1 / (1 + tc / (tc + 1))
        
        # Update tc berdasarkan C baru
        tc_adj = 1 + (1 - C) * 0.5
        tc = tc_initial * tc_adj
        iterations += 1
        
    if iterations >= MAX_ITERATIONS:
        warnings.append(f"Iterasi mencapai batas maksimum ({MAX_ITERATIONS}). Hasil mungkin kurang akurat.")
        
    intensity = (R24 / 24) * ((24 / tc) ** (2/3))
    q_peak = (C * intensity * A) / 3.6
    
    return {
        "method": "DER_WEDUWEN",
        "qPeak": round(float(q_peak), 3),
        "tc": round(float(tc), 3),
        "alpha": None,
        "beta": None,
        "C": round(float(C), 4),
        "intensity": round(float(intensity), 3),
        "warnings": warnings,
        "metadata": {
            "areaCategory": "Small-Medium",
            "formula": "Qp = C * I * A / 3.6 (iteratif)",
            "iterations": iterations
        }
    }

def melchior(A: float, L: float, S: float, R24: float, C_base: float = 0.7) -> ModifiedRationalResult:
    """
    Metode Melchior (Indonesia)
    Cocok untuk: A > 100 km2
    """
    warnings = []
    if A <= 100:
        warnings.append("Area terlalu kecil untuk Melchior. Pertimbangkan der Weduwen atau Haspers & Osugi.")
        
    tc = 0.1 * (L ** 0.8) * (S ** -0.3)
    if not np.isfinite(tc) or tc < 0.01:
        tc = 0.01
        
    # Koefisien reduksi luas elips
    alpha = 1 / (1 + (A / 120) ** 0.5)
    C = C_base * alpha
    
    intensity = (R24 / 24) * ((24 / tc) ** (2/3))
    q_peak = (C * intensity * A) / 3.6
    
    return {
        "method": "MELCHIOR",
        "qPeak": round(float(q_peak), 3),
        "tc": round(float(tc), 3),
        "alpha": round(float(alpha), 4),
        "beta": None,
        "C": round(float(C), 4),
        "intensity": round(float(intensity), 3),
        "warnings": warnings,
        "metadata": {
            "areaCategory": "Large",
            "formula": "Qp = C * I * A / 3.6, dimana C = C_base * alpha (reduksi elips)"
        }
    }

def calculate_design_flood_indo(inputs: dict[str, Any]) -> dict[str, Any]:
    """
    Router Hidrologi - Expert System untuk Pemilihan Metode
    """
    A = inputs.get("luasDasKm2", 0)
    L = inputs.get("panjangSungaiUtamaKm", 0)
    S = inputs.get("kemiringanSungai", 0)
    R24 = inputs.get("curahHujanHarianMaksimum", 0)
    C_base = inputs.get("koefisienPengaliran", 0.7)
    
    if A <= 3:
        raise ValueError(f"Area DAS terlalu kecil ({A:.2f} km2). Gunakan Metode Rasional Standar.")
    
    if A <= 100:
        recommended = der_weduwen(A, L, S, R24)
        alternatives = [haspers_osugi(A, L, S, R24)]
        category = "SMALL" if A <= 50 else "MEDIUM"
        recommendation = "der Weduwen (primary) atau Haspers & Osugi (alternative)"
    else:
        recommended = melchior(A, L, S, R24, C_base)
        alternatives = [haspers_osugi(A, L, S, R24)]
        category = "LARGE"
        recommendation = "Melchior (primary) atau Haspers & Osugi (alternative)"
        
    return {
        "recommended": recommended,
        "alternatives": alternatives,
        "areaAnalysis": {
            "area": A,
            "category": category,
            "recommendation": recommendation
        }
    }
