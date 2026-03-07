from __future__ import annotations
from typing import Dict, List, Optional, Any, Union

def validate_runoff_coefficient(c: float, land_use: str = "unknown") -> Dict[str, Union[bool, str]]:
    """Validasi Koefisien Pengaliran (C) sesuai Permen PU No. 12/2014."""
    if c < 0 or c > 1:
        return {"valid": False, "message": "Koefisien pengaliran harus antara 0 dan 1"}
        
    ranges = {
        'jalan-aspal': {'min': 0.85, 'max': 0.95},
        'pusat-kota': {'min': 0.70, 'max': 0.90},
        'pemukiman-padat': {'min': 0.60, 'max': 0.80},
        'pemukiman-sedang': {'min': 0.40, 'max': 0.60},
        'taman': {'min': 0.10, 'max': 0.25},
        'hutan': {'min': 0.10, 'max': 0.20},
    }
    
    r = ranges.get(land_use)
    if r and (c < r['min'] or c > r['max']):
        return {
            "valid": False, 
            "message": f"Koefisien untuk {land_use} biasanya {r['min']}-{r['max']}"
        }
        
    return {"valid": True, "message": "Valid"}

def validate_rational_method_area(area_km2: float) -> Dict[str, Union[bool, str]]:
    """Validasi Luas DAS untuk Metode Rasional sesuai SNI 2415:2016."""
    if area_km2 <= 0:
        return {"valid": False, "message": "Luas DAS harus positif"}
    if area_km2 > 50:
        return {
            "valid": False, 
            "message": "Metode Rasional hanya untuk DAS < 50 km². Gunakan HSS Nakayasu untuk DAS lebih besar"
        }
    return {"valid": True, "message": "Valid"}

def validate_nakayasu_params(alpha: float, tg: float, tr: float, area: float) -> Dict[str, Any]:
    """Validasi Parameter HSS Nakayasu sesuai SNI 2415:2016 Pasal 6.3."""
    errors = []
    if alpha < 1.5 or alpha > 3.0:
        errors.append("Parameter Alpha harus antara 1.5 - 3.0 (standard = 2.0)")
    if tr < 0.5 * tg or tr > tg:
        errors.append("Time unit (Tr) harus antara 0.5×Tg sampai 1.0×Tg")
    if area < 10:
        errors.append("HSS Nakayasu direkomendasikan untuk DAS > 10 km²")
        
    return {"valid": len(errors) == 0, "errors": errors}

def validate_channel_velocity(v: float, material: str = "beton") -> Dict[str, Union[bool, str]]:
    """Validasi Kecepatan Aliran Saluran sesuai SNI 03-3424-1994."""
    limits = {
        'beton': {'min': 0.3, 'max': 6.0},
        'pasangan-batu': {'min': 0.3, 'max': 4.0},
        'tanah': {'min': 0.3, 'max': 1.5},
        'rumput': {'min': 0.3, 'max': 1.0},
    }
    limit = limits.get(material, {'min': 0.3, 'max': 3.0})
    
    if v < limit['min']:
        return {"valid": False, "message": f"Kecepatan terlalu rendah (< {limit['min']} m/s), risiko sedimentasi"}
    if v > limit['max']:
        return {"valid": False, "message": f"Kecepatan terlalu tinggi (> {limit['max']} m/s), risiko erosi"}
    return {"valid": True, "message": "Kecepatan aman"}

def validate_freeboard(fb: float, q: float, channel_type: str = "sekunder") -> Dict[str, Union[bool, str]]:
    """Validasi Tinggi Jagaan (Freeboard) sesuai SNI 03-3424-1994."""
    if fb < 0:
        return {"valid": False, "message": "BAHAYA: Saluran meluap!"}
        
    min_fb = 0.2
    if channel_type == 'primer':
        min_fb = 0.5 if q > 5 else (0.4 if q > 1 else 0.3)
    elif channel_type == 'sekunder':
        min_fb = 0.3 if q > 1 else 0.25
        
    if fb < min_fb:
        return {"valid": False, "message": f"Tinggi jagaan kurang (min {min_fb} m untuk {channel_type})"}
    return {"valid": True, "message": "Tinggi jagaan aman"}
