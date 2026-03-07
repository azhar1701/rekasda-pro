from __future__ import annotations
import math
from typing import TypedDict, List

class DependableFlowOutput(TypedDict):
    Q80: float
    Qavg: float
    Qmax: float
    Qmin: float
    data_count: int

def dependable_flow(discharge_data: List[float], probability: float = 80.0) -> DependableFlowOutput:
    """
    Menghitung Debit Andalan (Dependable Flow)
    Sesuai SNI 6738:2015 Pasal 4.2
    Metode Weibull: P = m / (n + 1) × 100%
    """
    if len(discharge_data) < 12:
        raise ValueError("Minimal 12 data (1 tahun) diperlukan untuk analisis debit andalan.")

    # Urutkan data dari besar ke kecil
    sorted_data = sorted(discharge_data, reverse=True)
    n = len(sorted_data)

    # Hitung statistik dasar
    q_max = sorted_data[0]
    q_min = sorted_data[-1]
    q_avg = sum(sorted_data) / n

    # Hitung debit andalan dengan metode Weibull
    target_probability = probability / 100.0
    target_rank = math.ceil(target_probability * (n + 1))
    index = min(target_rank - 1, n - 1)

    q_target = sorted_data[index]

    return {
        "Q80": round(q_target, 3),
        "Qavg": round(q_avg, 3),
        "Qmax": round(q_max, 3),
        "Qmin": round(q_min, 3),
        "data_count": n,
    }

def monthly_dependable_flow(
    daily_data: List[float], 
    days_per_month: List[int] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
) -> List[float]:
    """
    Menghitung Debit Andalan Bulanan dari Data Harian
    """
    monthly_q80 = []
    start_index = 0

    for days in days_per_month:
        month_data = daily_data[start_index : start_index + days]
        if len(month_data) > 0:
            try:
                result = dependable_flow(month_data)
                monthly_q80.append(result["Q80"])
            except ValueError:
                # If month data < 12, we might still want to calculate it if possible, 
                # but the requirement says min 12. For monthly from daily, 
                # days is usually 28-31, so it's fine.
                # If it fails, we follow TS logic and push 0 or handle it.
                # TS logic: if monthData.length > 0, calculate.
                # Let's adjust dependable_flow to allow smaller sets if called from here?
                # No, let's just use a local version or relax the check.
                
                # Relaxed version for monthly:
                sorted_m = sorted(month_data, reverse=True)
                nm = len(sorted_m)
                tr = math.ceil(0.8 * (nm + 1))
                idx = min(tr - 1, nm - 1)
                monthly_q80.append(round(sorted_m[idx], 3))
        else:
            monthly_q80.append(0.0)
        
        start_index += days

    return monthly_q80

def flow_duration_curve(discharge_data: List[float]) -> List[dict[str, float]]:
    """
    Analisis Frekuensi Debit (Flow Duration Curve)
    """
    sorted_data = sorted(discharge_data, reverse=True)
    n = len(sorted_data)

    curve = []
    for i, discharge in enumerate(sorted_data):
        rank = i + 1
        prob = (rank / (n + 1)) * 100.0
        curve.append({
            "probability": round(prob, 2),
            "discharge": round(discharge, 3)
        })
    
    return curve

def validate_water_availability(q80: float, demand: float) -> dict[str, any]:
    """
    Validasi Ketersediaan Air Sesuai SNI 6738:2015
    """
    if demand <= 0:
        return {
            "ratio": float('inf') if q80 > 0 else 0.0,
            "status": "Aman",
            "recommendation": "Tidak ada kebutuhan air terdefinisi."
        }
    
    ratio = q80 / demand
    
    if ratio >= 1.5:
        status = "Aman"
        recommendation = "Ketersediaan air mencukupi dengan margin aman"
    elif ratio >= 1.0:
        status = "Waspada"
        recommendation = "Ketersediaan air cukup, perlu monitoring berkala"
    else:
        status = "Kritis"
        recommendation = "Ketersediaan air tidak mencukupi, perlu sumber alternatif"

    return {
        "ratio": round(ratio, 2),
        "status": status,
        "recommendation": recommendation
    }
