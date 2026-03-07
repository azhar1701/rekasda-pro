from __future__ import annotations
from typing import TypedDict, List, Optional
import numpy as np

class RationalMethodOutput(TypedDict):
    Q: float
    C: float
    I: float
    A: float
    area_unit: str
    factor_used: float
    warnings: List[str]

def validate_rational_input(C: float, I: float, A: float) -> tuple[bool, List[str]]:
    """
    Validasi input metode rasional sesuai standar SNI.
    """
    errors = []
    if not (0 <= C <= 1):
        errors.append("Koefisien pengaliran (C) harus antara 0 dan 1.")
    if I <= 0:
        errors.append("Intensitas hujan (I) harus lebih besar dari 0.")
    if A <= 0:
        errors.append("Luas DAS (A) harus lebih besar dari 0.")
    
    return len(errors) == 0, errors

def rational_method(C: float, I: float, A: float, area_unit: str = "km2") -> RationalMethodOutput:
    """
    Menghitung debit puncak menggunakan Metode Rasional.
    
    Formula:
    - km2: Q = 0.278 * C * I * A
    - ha:  Q = 0.00278 * C * I * A
    
    Reference: SNI 2415:2016 Pasal 5.2
    """
    success, errors = validate_rational_input(C, I, A)
    if not success:
        raise ValueError("; ".join(errors))
    
    warnings = []
    if area_unit.lower() == "km2":
        factor = 0.278
        if A > 3:
            warnings.append(f"Peringatan: Luas DAS ({A} km²) melebihi batas ideal metode rasional (3 km²).")
    elif area_unit.lower() == "ha":
        factor = 0.00278
        if A > 5000:
            warnings.append(f"Peringatan: Luas DAS ({A} ha) melebihi batas maksimal metode rasional (5000 ha).")
        elif A > 300:
            warnings.append(f"Peringatan: Metode Rasional kurang akurat untuk DAS > 300 ha.")
    else:
        raise ValueError("Satuan luas harus 'km2' atau 'ha'.")
    
    if C < 0.1:
        warnings.append("Koefisien C sangat rendah. Pastikan tata guna lahan sudah sesuai.")
    elif C > 0.9:
        warnings.append("Koefisien C sangat tinggi. Pastikan area sebagian besar kedap air.")
        
    if I > 200:
        warnings.append("Intensitas hujan sangat tinggi (>200 mm/jam). Verifikasi data hujan rencana.")

    Q = factor * C * I * A
    
    return {
        "Q": round(float(Q), 3),
        "C": C,
        "I": I,
        "A": A,
        "area_unit": area_unit,
        "factor_used": factor,
        "warnings": warnings
    }
