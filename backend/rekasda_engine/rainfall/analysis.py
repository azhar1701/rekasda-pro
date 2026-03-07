from __future__ import annotations
import numpy as np
from typing import List, Dict, Any

def thiessen_average(stations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Thiessen Polygon Weighted Average
    Formula: P = Σ(Ai * Pi) / ΣAi
    """
    if not stations:
        raise ValueError("Minimal satu stasiun diperlukan untuk perhitungan Thiessen.")
        
    total_area = sum(s['luasPengaruh'] for s in stations)
    if total_area <= 0:
        raise ValueError("Total luas pengaruh harus > 0.")
        
    weights = []
    for s in stations:
        weights.append({
            'stasiunId': s['stasiunId'],
            'namaStasiun': s['namaStasiun'],
            'bobot': s['luasPengaruh'] / total_area
        })
        
    min_years = min(len(s['annualMax']) for s in stations)
    if min_years == 0:
        return {'bobotStasiun': weights, 'totalLuas': total_area, 'hujanRataRataDAS': []}
        
    weighted_series = []
    for i in range(min_years):
        weighted_sum = 0.0
        for s in stations:
            weight = s['luasPengaruh'] / total_area
            weighted_sum += weight * s['annualMax'][i]
        weighted_series.append(round(weighted_sum, 2))
        
    return {
        'bobotStasiun': weights,
        'totalLuas': total_area,
        'hujanRataRataDAS': weighted_series
    }

def algebraic_average(stations: List[Dict[str, Any]]) -> List[float]:
    """
    Simple mean per year
    """
    if not stations:
        return []
        
    min_years = min(len(s['annualMax']) for s in stations)
    result = []
    for i in range(min_years):
        avg = sum(s['annualMax'][i] for s in stations) / len(stations)
        result.append(round(avg, 2))
        
    return result

def isohyet_average(segments: List[Dict[str, Any]]) -> List[float]:
    """
    Weighted by area between isohyet lines
    """
    if not segments:
        return []
        
    total_area = sum(s['luasAntarGaris'] for s in segments)
    if total_area <= 0:
        return []
        
    min_years = min(len(s['annualMax']) for s in segments)
    result = []
    for i in range(min_years):
        weighted_sum = sum(s['luasAntarGaris'] * s['annualMax'][i] for s in segments)
        result.append(round(weighted_sum / total_area, 2))
        
    return result

def calculate_arf(luas_das: float, hujan_titik: float, durasi: float = 24) -> Dict[str, Any]:
    """
    Area Reduction Factor (ARF)
    ARF = 1 - c * A^0.35 (c varies by duration: ≤1h→0.06, ≤6h→0.05, ≤12h→0.045, 24h→0.04). Clamp 0.1-1.0
    """
    if luas_das <= 0:
        raise ValueError("Luas DAS harus > 0 km².")
    if hujan_titik <= 0:
        raise ValueError("Curah hujan titik harus > 0 mm.")
        
    c = 0.04
    if durasi <= 1:
        c = 0.06
    elif durasi <= 6:
        c = 0.05
    elif durasi <= 12:
        c = 0.045
        
    arf = 1 - c * np.pow(luas_das, 0.35)
    arf = max(0.1, min(1.0, arf))
    
    hujan_das = round(hujan_titik * arf, 2)
    
    return {
        'arf': round(arf, 4),
        'hujanTitik': hujan_titik,
        'hujanDAS': hujan_das
    }

def calculate_pmp(annual_max: List[float]) -> Dict[str, Any]:
    """
    Probable Maximum Precipitation (PMP)
    PMP = mean + Kn * std. Kn by n: ≤10→10, ≤20→12, ≤30→13, ≤50→14, else→15
    """
    n = len(annual_max)
    if n < 3:
        raise ValueError("Minimal 3 data tahunan diperlukan untuk perhitungan PMP.")
        
    mean = sum(annual_max) / n
    variance = sum((x - mean) ** 2 for x in annual_max) / (n - 1)
    std_dev = np.sqrt(variance)
    
    kn = 15
    if n <= 10:
        kn = 10
    elif n <= 20:
        kn = 12
    elif n <= 30:
        kn = 13
    elif n <= 50:
        kn = 14
        
    pmp = mean + kn * std_dev if std_dev > 0 else mean
    
    return {
        'pmp': round(pmp, 2),
        'mean': round(mean, 2),
        'stdDev': round(std_dev, 2),
        'kn': kn
    }
