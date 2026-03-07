from __future__ import annotations
import numpy as np
from typing import List, Dict, Any
from .intensity import mononobe

def generate_incremental_rainfall(R24: float, duration: int) -> List[float]:
    """
    Generate cumulative via Mononobe, then incremental differences
    """
    if duration <= 0:
        raise ValueError("Durasi harus bilangan bulat positif.")
    
    cumulatives = []
    for t in range(1, duration + 1):
        intensity = mononobe(R24, t)
        cumulatives.append(intensity * t)
        
    incrementals = []
    for i in range(len(cumulatives)):
        if i == 0:
            incrementals.append(cumulatives[0])
        else:
            incrementals.append(max(0.0, cumulatives[i] - cumulatives[i - 1]))
            
    return incrementals

def arrange_abm(incrementals: List[float]) -> List[float]:
    """
    Alternating Block Method (ABM) reordering
    Sort descending, place center-out alternating (center gets largest, then right, left, right, left...)
    """
    n = len(incrementals)
    if n == 0:
        return []
    if n == 1:
        return list(incrementals)
        
    sorted_vals = sorted(incrementals, reverse=True)
    result = [0.0] * n
    center = n // 2
    
    left = center
    right = center
    
    for i in range(len(sorted_vals)):
        if i == 0:
            result[center] = sorted_vals[i]
        elif i % 2 == 1:
            right += 1
            if right < n:
                result[right] = sorted_vals[i]
        else:
            left -= 1
            if left >= 0:
                result[left] = sorted_vals[i]
                
    return result

def generate_hyetograph(R24: float, duration: int = 6) -> Dict[str, Any]:
    """
    Complete: Mononobe intensity + cumulative + incremental + ABM reordering
    Return dict with rows [{jam, intensitas, kumulatif, inkremental, abm}], jamPuncak, hujanPuncak, totalHujan
    """
    if R24 <= 0:
        raise ValueError("Hujan harian rencana (R24) harus > 0 mm.")
    if duration <= 0 or duration > 24:
        raise ValueError("Durasi hujan harus antara 1–24 jam.")
        
    incrementals = generate_incremental_rainfall(R24, duration)
    abm_values = arrange_abm(incrementals)
    
    rows = []
    for t in range(1, duration + 1):
        intensity = mononobe(R24, t)
        cum_sum = intensity * t
        rows.append({
            'jam': t,
            'intensitas': round(intensity, 2),
            'kumulatif': round(cum_sum, 2),
            'inkremental': round(incrementals[t - 1], 2),
            'abm': round(abm_values[t - 1], 2)
        })
        
    peak_val = max(abm_values)
    peak_idx = abm_values.index(peak_val)
    
    return {
        'durasi': duration,
        'r24': R24,
        'rows': rows,
        'jamPuncak': peak_idx + 1,
        'hujanPuncak': round(peak_val, 2),
        'totalHujan': round(sum(abm_values), 2)
    }
