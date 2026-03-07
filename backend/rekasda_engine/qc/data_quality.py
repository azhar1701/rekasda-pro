from __future__ import annotations
import math
import numpy as np
from typing import TypedDict, List, Optional, Dict, Any
from ..constants.tables import GRUBBS_TABLE, RAPS_Q_TABLE, RAPS_R_TABLE, F_TABLE, T_TABLE

class RainfallData(TypedDict):
    tahun: int
    hujan: float

class QCValidationError(Exception):
    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code

def interpolate(table: Dict[int, float], n: int) -> float:
    keys = sorted(table.keys())
    if n <= keys[0]:
        return table[keys[0]]
    if n >= keys[-1]:
        return table[keys[-1]]
    
    for i in range(len(keys) - 1):
        if keys[i] <= n <= keys[i + 1]:
            x1, x2 = keys[i], keys[i + 1]
            y1, y2 = table[x1], table[x2]
            return y1 + ((y2 - y1) / (x2 - x1)) * (n - x1)
    return table[keys[-1]]

def validate_data_length(data: List[RainfallData]) -> None:
    if not data or not isinstance(data, list):
        raise QCValidationError('Data harus berupa array', 'INVALID_INPUT')
    if len(data) < 10:
        raise QCValidationError(f'Data terlalu pendek (Minimal 10 tahun, ditemukan {len(data)} tahun)', 'INSUFFICIENT_DATA')
    if len(data) > 100:
        raise QCValidationError('Data terlalu panjang (Maksimal 100 tahun)', 'EXCESSIVE_DATA')
    
    years = []
    for d in data:
        if not isinstance(d.get('tahun'), (int, float)) or not isinstance(d.get('hujan'), (int, float)):
            raise QCValidationError(f"Data tidak valid pada tahun {d.get('tahun')}", 'INVALID_DATA_TYPE')
        if d['hujan'] < 0:
            raise QCValidationError(f"Curah hujan negatif pada tahun {d['tahun']}", 'NEGATIVE_RAINFALL')
        if not math.isfinite(d['hujan']) or not math.isfinite(d['tahun']):
            raise QCValidationError(f"Data tidak valid pada tahun {d['tahun']}", 'NON_FINITE_VALUE')
        years.append(d['tahun'])
    
    if len(years) != len(set(years)):
        raise QCValidationError('Ditemukan tahun duplikat', 'DUPLICATE_YEARS')

def cek_konsistensi_raps(data: List[RainfallData]) -> Dict[str, Any]:
    try:
        validate_data_length(data)
    except QCValidationError as e:
        return {"isKonsisten": False, "QHitung": 0, "RHitung": 0, "QKritis": 0, "RKritis": 0, "pesan": f"✗ {str(e)}"}
    
    n = len(data)
    sorted_data = sorted(data, key=lambda x: x['tahun'])
    xi = [d['hujan'] for d in sorted_data]
    
    mean = sum(xi) / n
    # POPULATION std dev (÷n)
    variance = sum((x - mean)**2 for x in xi) / n
    dy = math.sqrt(variance)
    
    if dy == 0 or not math.isfinite(dy):
        return {"isKonsisten": False, "QHitung": 0, "RHitung": 0, "QKritis": 0, "RKritis": 0, "pesan": "✗ Standar deviasi nol (data konstan)"}
    
    sk = []
    cum_sum = 0
    for x in xi:
        cum_sum += (x - mean)
        sk.append(cum_sum / dy)
    
    q_hitung = max(abs(s) for s in sk)
    r_hitung = max(sk) - min(sk)
    
    q_kritis = interpolate(RAPS_Q_TABLE, n) / math.sqrt(n)
    r_kritis = interpolate(RAPS_R_TABLE, n) / math.sqrt(n)
    
    is_konsisten = q_hitung <= q_kritis and r_hitung <= r_kritis
    
    pesan = (f"✓ Data konsisten (RAPS: Q={q_hitung:.3f} ≤ {q_kritis:.3f}, R={r_hitung:.3f} ≤ {r_kritis:.3f})"
             if is_konsisten else
             f"✗ Data tidak konsisten: Q={q_hitung:.3f} {'✓' if q_hitung <= q_kritis else f'> {q_kritis:.3f} ✗'}, R={r_hitung:.3f} {'✓' if r_hitung <= r_kritis else f'> {r_kritis:.3f} ✗'}")
    
    return {
        "isKonsisten": is_konsisten,
        "QHitung": q_hitung,
        "RHitung": r_hitung,
        "QKritis": q_kritis,
        "RKritis": r_kritis,
        "pesan": pesan
    }

def cek_outlier_grubbs(data: List[RainfallData]) -> Dict[str, Any]:
    try:
        validate_data_length(data)
    except QCValidationError as e:
        return {"isBebasOutlier": False, "mean": 0, "stdDev": 0, "upperLimit": 0, "lowerLimit": 0, "outliers": [], "pesan": f"✗ {str(e)}"}
    
    n = len(data)
    hujan = [d['hujan'] for d in data]
    mean = sum(hujan) / n
    # SAMPLE std dev (÷(n-1))
    variance = sum((x - mean)**2 for x in hujan) / (n - 1)
    std_dev = math.sqrt(variance)
    
    if std_dev == 0 or not math.isfinite(std_dev):
        return {"isBebasOutlier": True, "mean": mean, "stdDev": 0, "upperLimit": mean, "lowerLimit": mean, "outliers": [], "pesan": "⚠ Standar deviasi nol (data identik)"}
    
    kn = interpolate(GRUBBS_TABLE, n)
    upper_limit = mean + kn * std_dev
    lower_limit = mean - kn * std_dev
    
    outliers = []
    for d in data:
        if d['hujan'] > upper_limit:
            outliers.append({"tahun": d['tahun'], "hujan": d['hujan'], "type": "HIGH"})
        elif d['hujan'] < lower_limit:
            outliers.append({"tahun": d['tahun'], "hujan": d['hujan'], "type": "LOW"})
            
    is_bebas_outlier = len(outliers) == 0
    
    pesan = (f"✓ Tidak ada outlier (Grubbs: Kn={kn:.3f}, batas=[{lower_limit:.1f}, {upper_limit:.1f}])"
             if is_bebas_outlier else
             f"✗ Ditemukan {len(outliers)} outlier: {', '.join([f'{o['tahun']} ({o['hujan']:.1f}mm, {o['type']})' for o in outliers])}")
    
    return {
        "isBebasOutlier": is_bebas_outlier,
        "mean": mean,
        "stdDev": std_dev,
        "upperLimit": upper_limit,
        "lowerLimit": lower_limit,
        "outliers": outliers,
        "pesan": pesan
    }

def cek_homogenitas(data: List[RainfallData]) -> Dict[str, Any]:
    try:
        validate_data_length(data)
    except QCValidationError as e:
        return {"isHomogen": False, "fTest": {"F": 0, "Fkritis": 0, "lulus": False}, "tTest": {"t": 0, "tkritis": 0, "lulus": False}, "pesan": f"✗ {str(e)}"}
    
    sorted_data = sorted(data, key=lambda x: x['tahun'])
    n = len(sorted_data)
    mid = n // 2
    
    seri1 = [d['hujan'] for d in sorted_data[:mid]]
    seri2 = [d['hujan'] for d in sorted_data[mid:]]
    n1, n2 = len(seri1), len(seri2)
    
    mean1 = sum(seri1) / n1
    mean2 = sum(seri2) / n2
    var1 = sum((x - mean1)**2 for x in seri1) / (n1 - 1)
    var2 = sum((x - mean2)**2 for x in seri2) / (n2 - 1)
    
    if var1 == 0 or var2 == 0 or not math.isfinite(var1) or not math.isfinite(var2):
        return {"isHomogen": True, "fTest": {"F": 1, "Fkritis": 0, "lulus": True}, "tTest": {"t": 0, "tkritis": 0, "lulus": True}, "pesan": "⚠ Varians nol pada salah satu grup"}
    
    var_max = max(var1, var2)
    var_min = min(var1, var2)
    f_val = var_max / var_min
    
    df1 = (n1 if var1 == var_max else n2) - 1
    df2 = (n1 if var1 == var_min else n2) - 1
    
    f_kritis = interpolate(F_TABLE, min(df1, df2))
    f_lulus = f_val <= f_kritis
    
    sp = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n - 2))
    t_val = abs(mean1 - mean2) / (sp * math.sqrt(1 / n1 + 1 / n2))
    t_kritis = interpolate(T_TABLE, n - 2)
    t_lulus = t_val <= t_kritis
    
    is_homogen = f_lulus and t_lulus
    
    pesan = (f"✓ Data homogen (F={f_val:.2f} ≤ {f_kritis:.2f}, t={t_val:.2f} ≤ {t_kritis:.2f})"
             if is_homogen else
             f"✗ Data tidak homogen: F={f_val:.2f} {'✓' if f_lulus else f'> {f_kritis:.2f} ✗'}, t={t_val:.2f} {'✓' if t_lulus else f'> {t_kritis:.2f} ✗'}")
    
    return {
        "isHomogen": is_homogen,
        "fTest": {"F": f_val, "Fkritis": f_kritis, "lulus": f_lulus},
        "tTest": {"t": t_val, "tkritis": t_kritis, "lulus": t_lulus},
        "pesan": pesan
    }

def cek_double_mass_curve(target_data: List[RainfallData], reference_data: List[RainfallData]) -> Dict[str, Any]:
    try:
        validate_data_length(target_data)
        validate_data_length(reference_data)
    except QCValidationError as e:
        return {"isKonsisten": False, "koreksiDiperlukan": False, "dataPlot": [], "pesan": f"✗ {str(e)}"}
    
    ref_map = {d['tahun']: d['hujan'] for d in reference_data}
    synced_data = sorted([d for d in target_data if d['tahun'] in ref_map], key=lambda x: x['tahun'])
    
    if len(synced_data) < 10:
        return {"isKonsisten": False, "koreksiDiperlukan": False, "dataPlot": [], "pesan": "✗ Data beririsan kurang dari 10 tahun"}
    
    data_plot = []
    sum_ref = 0
    sum_target = 0
    
    for d in synced_data:
        sum_target += d['hujan']
        sum_ref += ref_map[d['tahun']]
        data_plot.append({
            "tahun": d['tahun'],
            "akumulasiTarget": sum_target,
            "akumulasiReferensi": sum_ref
        })
        
    n = len(data_plot)
    mid = n // 2
    
    def get_slope(pts):
        if not pts: return 0
        x = [p['akumulasiReferensi'] for p in pts]
        y = [p['akumulasiTarget'] for p in pts]
        # Simple linear regression slope
        n_pts = len(pts)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_x2 = sum(xi**2 for xi in x)
        denom = (n_pts * sum_x2 - sum_x**2)
        return (n_pts * sum_xy - sum_x * sum_y) / denom if denom != 0 else 0

    slope1 = get_slope(data_plot[:mid])
    slope2 = get_slope(data_plot[mid:])
    
    slope_diff = abs((slope1 - slope2) / max(slope1, slope2)) if max(slope1, slope2) != 0 else 0
    is_konsisten = slope_diff < 0.15
    
    faktor_koreksi = slope1 / slope2 if slope2 != 0 else 1.0
    break_year = data_plot[mid]['tahun'] if not is_konsisten else None
    
    pesan = (f"✓ Data konsisten secara grafis (Beda Slope: {(slope_diff*100):.1f}%)"
             if is_konsisten else
             f"✗ Patahan terdeteksi sekitar tahun {break_year}. Faktor Koreksi: {faktor_koreksi:.3f}")
    
    return {
        "isKonsisten": is_konsisten,
        "koreksiDiperlukan": not is_konsisten,
        "breakYear": break_year,
        "faktorKoreksi": faktor_koreksi,
        "dataPlot": data_plot,
        "pesan": pesan
    }

def run_full_qc(data: List[RainfallData]) -> Dict[str, Any]:
    try:
        validate_data_length(data)
    except QCValidationError as e:
        error_msg = f"✗ {str(e)}"
        return {
            "isKonsisten": False,
            "isBebasOutlier": False,
            "isHomogen": False,
            "details": {
                "raps": {"isKonsisten": False, "pesan": error_msg},
                "grubbs": {"isBebasOutlier": False, "pesan": error_msg},
                "homogenitas": {"isHomogen": False, "pesan": error_msg}
            }
        }
    
    raps = cek_konsistensi_raps(data)
    grubbs = cek_outlier_grubbs(data)
    homogenitas = cek_homogenitas(data)
    
    return {
        "isKonsisten": raps['isKonsisten'],
        "isBebasOutlier": grubbs['isBebasOutlier'],
        "isHomogen": homogenitas['isHomogen'],
        "details": {
            "raps": raps,
            "grubbs": grubbs,
            "homogenitas": homogenitas
        }
    }
