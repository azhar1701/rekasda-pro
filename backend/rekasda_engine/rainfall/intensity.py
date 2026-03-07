from __future__ import annotations
import numpy as np
from typing import Dict, Any

def mononobe(R24: float, tc: float) -> float:
    """
    Rumus Mononobe (SNI 2415:2016 Pasal 5.2.2)
    Formula: I = (R24 / 24) * (24 / tc)^(2/3)
    """
    if R24 <= 0:
        return 0.0
    if tc <= 0:
        raise ValueError("Durasi tc harus > 0")
    return (R24 / 24) * np.pow(24 / tc, 2 / 3)

def talbot(R24: float, tc: float) -> float:
    """
    Rumus Talbot
    Formula: I = (0.21 * R24) / (tc + 0.5)
    """
    if R24 <= 0:
        return 0.0
    if tc <= 0:
        raise ValueError("Durasi tc harus > 0")
    a = 0.21
    b = 0.5
    return (a * R24) / (tc + b)

def sherman(R24: float, tc: float) -> float:
    """
    Rumus Sherman
    Formula: I = (1.67 * R24) / (tc + 0.5)^0.67
    """
    if R24 <= 0:
        return 0.0
    if tc <= 0:
        raise ValueError("Durasi tc harus > 0")
    a = 1.67
    b = 0.5
    n = 0.67
    return (a * R24) / np.pow(tc + b, n)

def calculate_rainfall_intensity(R24: float, tc: float, method: str = 'mononobe') -> Dict[str, Any]:
    """
    Menghitung Intensitas Hujan dengan berbagai metode
    Validation: R24 > 0, tc > 0. Indonesian error messages.
    """
    if R24 <= 0:
        raise ValueError("Curah hujan rencana (R24) harus > 0 mm.")
    if tc <= 0:
        raise ValueError("Durasi hujan (tc) harus > 0 jam.")
    
    intensity = 0.0
    method_name = ""
    
    if method == 'mononobe':
        intensity = mononobe(R24, tc)
        method_name = "Mononobe (SNI 2415:2016)"
    elif method == 'talbot':
        intensity = talbot(R24, tc)
        method_name = "Talbot"
    elif method == 'sherman':
        intensity = sherman(R24, tc)
        method_name = "Sherman"
    else:
        raise ValueError(f"Metode '{method}' tidak dikenal.")
        
    return {
        'I': round(intensity, 2),
        'method': method_name
    }
