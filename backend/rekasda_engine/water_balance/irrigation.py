from __future__ import annotations
from typing import TypedDict, List, Literal, Optional

# Constants
DEFAULT_KC = {"padi": 1.10, "palawija": 0.80, "bero": 0.00}
DEFAULT_PERKOLASI = {"padi": 2.0, "palawija": 1.0, "bero": 0.0}
DEFAULT_ETO_DAILY = [4.8, 5.0, 5.0, 5.0, 4.5, 4.0, 3.7, 4.0, 4.5, 5.0, 5.0, 4.8]
MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
DEFAULT_POLA_TANAM = [
    'padi', 'padi', 'padi', 'padi',
    'palawija', 'palawija', 'palawija', 'palawija',
    'bero', 'bero',
    'padi', 'padi'
]

class IrrigationMonthlyInput(TypedDict):
    month: str
    daysInMonth: int
    polaTanam: Literal['padi', 'palawija', 'bero']
    kc: float
    perkolasi: float
    wlr: float
    rpiEfektif: float
    eto: float

class IrrigationMonthlyResult(TypedDict):
    month: str
    polaTanam: str
    etc: float
    perkolasi: float
    wlr: float
    rpiEfektif: float
    nfr: float
    dr: float
    nfrLsHa: float

class NeracaAirFinalRow(TypedDict):
    month: str
    ketersediaan: float
    irigasi: float
    airBaku: float
    lingkungan: float
    totalKebutuhan: float
    neraca: float
    status: Literal['Surplus', 'Defisit', 'Seimbang']

def calculate_irrigation_demand(
    luas_irigasi: float,
    efisiensi: float,
    data: List[IrrigationMonthlyInput]
) -> List[IrrigationMonthlyResult]:
    """
    Calculate monthly irrigation demand using KP-01 standard.
    NFR (mm/day) = (ETo × Kc) + P + WLR − Reff
    DR  (m³/s)   = NFR × LuasIrigasi × 10 / (Efisiensi × 86400)
    """
    if not data:
        raise ValueError('Data input bulanan tidak boleh kosong.')
    if luas_irigasi <= 0:
        raise ValueError('Luas irigasi harus > 0 Ha.')
    if not (0 < efisiensi <= 1):
        raise ValueError('Efisiensi irigasi harus antara 0 dan 1.')

    results = []
    for d in data:
        # ETc = ETo × Kc (consumptive use, mm/day)
        etc = d['eto'] * d['kc']

        # NFR = ETc + P + WLR − Reff (mm/day)
        if d['polaTanam'] == 'bero':
            nfr = 0.0
        else:
            nfr = max(0.0, etc + d['perkolasi'] + d['wlr'] - d['rpiEfektif'])

        # NFR in L/s/Ha for reference
        # 1 mm/day = 0.1157 L/s/Ha
        nfr_ls_ha = nfr * (10000 * 0.001) / 86400 * 1000

        # DR = NFR (mm/day) × Area (Ha) × 10 / (efisiensi × 86400)
        dr = (nfr * luas_irigasi * 10) / (efisiensi * 86400)

        results.append({
            "month": d['month'],
            "polaTanam": d['polaTanam'],
            "etc": round(etc, 2),
            "perkolasi": round(d['perkolasi'], 2),
            "wlr": round(d['wlr'], 2),
            "rpiEfektif": round(d['rpiEfektif'], 2),
            "nfr": round(nfr, 2),
            "dr": round(dr, 4),
            "nfrLsHa": round(nfr_ls_ha, 4),
        })
    
    return results

def calculate_raw_water_demand(populasi: int, standar_domestik: float, industri_m3s: float) -> float:
    """
    Calculate raw water demand (constant across all months).
    Domestic: (jiwa × L/cap/day) / (1000 × 86400) = m³/s
    """
    domestic = (populasi * standar_domestik) / 86400000
    return domestic + industri_m3s

def calculate_neraca_air_final(
    supply: List[float],
    irrigation_dr: List[float],
    raw_water_demand: float
) -> List[NeracaAirFinalRow]:
    """
    Calculate final 12-month water balance.
    Environmental flow = 10% of available (UU 17/2019 Pasal 22)
    """
    if len(supply) != 12 or len(irrigation_dr) != 12:
        raise ValueError('Data ketersediaan dan irigasi harus 12 bulan.')

    results = []
    for i, month in enumerate(MONTH_LABELS):
        ketersediaan = supply[i]
        irigasi = irrigation_dr[i]
        air_baku = raw_water_demand
        lingkungan = ketersediaan * 0.10
        total_kebutuhan = irigasi + air_baku + lingkungan
        neraca = ketersediaan - total_kebutuhan

        if neraca > 0.001:
            status = 'Surplus'
        elif neraca < -0.001:
            status = 'Defisit'
        else:
            status = 'Seimbang'

        results.append({
            "month": month,
            "ketersediaan": round(ketersediaan, 4),
            "irigasi": round(irigasi, 4),
            "airBaku": round(air_baku, 4),
            "lingkungan": round(lingkungan, 4),
            "totalKebutuhan": round(total_kebutuhan, 4),
            "neraca": round(neraca, 4),
            "status": status,
        })
    
    return results

def generate_default_irrigation_input(monthly_reff_mm: Optional[List[float]] = None) -> List[IrrigationMonthlyInput]:
    """
    Generate default 12-month irrigation input using typical Indonesian values.
    """
    inputs = []
    for i, month in enumerate(MONTH_LABELS):
        pola = DEFAULT_POLA_TANAM[i]
        # Convert monthly Reff (mm/month) to mm/day
        if monthly_reff_mm:
            reff_daily = (monthly_reff_mm[i] * 0.7) / DAYS_IN_MONTH[i]
        else:
            reff_daily = 0.0

        # WLR at planting months (Nov/Jan)
        wlr = 1.1 if (pola == 'padi' and (i == 0 or i == 10)) else 0.0

        inputs.append({
            "month": month,
            "daysInMonth": DAYS_IN_MONTH[i],
            "polaTanam": pola,
            "kc": DEFAULT_KC[pola],
            "perkolasi": DEFAULT_PERKOLASI[pola],
            "wlr": wlr,
            "rpiEfektif": round(reff_daily, 2),
            "eto": DEFAULT_ETO_DAILY[i],
        })
    
    return inputs
