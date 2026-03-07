from __future__ import annotations
from typing import TypedDict, Dict

class RunoffCoefficientData(TypedDict):
    value: float
    description: str
    source: str
    category: str  # 'urban' | 'rural' | 'surface'

class ManningRoughnessData(TypedDict):
    value: float
    description: str
    source: str
    category: str  # 'natural' | 'artificial'

class HSSParameter(TypedDict):
    alpha: float
    description: str
    range: Dict[str, float]  # {'min': float, 'max': float}
    source: str

# Koefisien Pengaliran (C) - Runoff Coefficients
# Sumber: Permen PU No. 12/PRT/M/2014 & Suripin (2004)
SNI_RUNOFF_COEFFICIENTS: Dict[str, RunoffCoefficientData] = {
    "JALAN_ASPAL": {
        "value": 0.95,
        "description": "Jalan Aspal",
        "source": "Permen PU 12/2014",
        "category": "surface",
    },
    "JALAN_BETON": {
        "value": 0.95,
        "description": "Jalan Beton",
        "source": "Permen PU 12/2014",
        "category": "surface",
    },
    "JALAN_PAVING": {
        "value": 0.85,
        "description": "Jalan Paving Block",
        "source": "Suripin 2004",
        "category": "surface",
    },
    "PUSAT_KOTA": {
        "value": 0.85,
        "description": "Pusat Kota (Kawasan Komersial)",
        "source": "Permen PU 12/2014",
        "category": "urban",
    },
    "PEMUKIMAN_PADAT": {
        "value": 0.70,
        "description": "Pemukiman Padat",
        "source": "Suripin 2004",
        "category": "urban",
    },
    "PEMUKIMAN_SEDANG": {
        "value": 0.50,
        "description": "Pemukiman Sedang",
        "source": "Suripin 2004",
        "category": "urban",
    },
    "PEMUKIMAN_JARANG": {
        "value": 0.30,
        "description": "Pemukiman Jarang",
        "source": "Suripin 2004",
        "category": "urban",
    },
    "TAMAN": {
        "value": 0.15,
        "description": "Taman dan Ruang Terbuka Hijau",
        "source": "Permen PU 12/2014",
        "category": "urban",
    },
    "LAPANGAN": {
        "value": 0.20,
        "description": "Lapangan Olahraga",
        "source": "Suripin 2004",
        "category": "urban",
    },
    "HUTAN": {
        "value": 0.15,
        "description": "Hutan Lebat",
        "source": "Suripin 2004",
        "category": "rural",
    },
    "PERTANIAN": {
        "value": 0.30,
        "description": "Lahan Pertanian",
        "source": "Suripin 2004",
        "category": "rural",
    },
    "TANAH_GUNDUL": {
        "value": 0.60,
        "description": "Tanah Terbuka/Gundul",
        "source": "Suripin 2004",
        "category": "rural",
    },
}

# Koefisien Kekasaran Manning (n)
# Sumber: Modul Drainase Perkotaan & SNI 2415:2016
SNI_MANNING_ROUGHNESS: Dict[str, ManningRoughnessData] = {
    "BETON_HALUS": {
        "value": 0.013,
        "description": "Beton Halus (Finishing Sendok)",
        "source": "SNI 2415:2016",
        "category": "artificial",
    },
    "BETON_KASAR": {
        "value": 0.015,
        "description": "Beton Kasar",
        "source": "SNI 2415:2016",
        "category": "artificial",
    },
    "PASANGAN_BATU": {
        "value": 0.025,
        "description": "Pasangan Batu Kali (Semen)",
        "source": "Modul Drainase",
        "category": "artificial",
    },
    "BAJA": {
        "value": 0.012,
        "description": "Pipa Baja",
        "source": "SNI 2415:2016",
        "category": "artificial",
    },
    "PVC": {
        "value": 0.010,
        "description": "Pipa PVC",
        "source": "SNI 2415:2016",
        "category": "artificial",
    },
    "TANAH_BERSIH": {
        "value": 0.022,
        "description": "Saluran Tanah Bersih",
        "source": "SNI 2415:2016",
        "category": "natural",
    },
    "TANAH_KERIKIL": {
        "value": 0.030,
        "description": "Saluran Tanah Berkerikil",
        "source": "SNI 2415:2016",
        "category": "natural",
    },
    "BERUMPUT": {
        "value": 0.035,
        "description": "Saluran Alami Berumput",
        "source": "SNI 2415:2016",
        "category": "natural",
    },
    "SUNGAI_BERLIKU": {
        "value": 0.045,
        "description": "Sungai Alami Berliku",
        "source": "SNI 2415:2016",
        "category": "natural",
    },
}

# Parameter HSS Nakayasu
# Sumber: SNI 2415:2016 Pasal 6.3
SNI_HSS_NAKAYASU: HSSParameter = {
    "alpha": 2.0,
    "description": "Parameter Hidrograf Satuan Sintetik Nakayasu (Standard)",
    "range": {"min": 1.5, "max": 3.0},
    "source": "SNI 2415:2016 Pasal 6.3",
}

RATIONAL_CONVERSION_FACTOR = 0.278
SNI_RATIONAL_AREA_LIMIT_KM2 = 3.0
SNI_RATIONAL_AREA_LIMIT_HA = 300

SNI_VALIDATION_LIMITS = {
    "runoffCoefficient": {"min": 0.0, "max": 1.0},
    "catchmentArea": {"min": 0.01, "max": 10000},  # km²
    "rainfallIntensity": {"min": 0.1, "max": 500},  # mm/jam
    "timeConcentration": {"min": 0.1, "max": 24},  # jam
    "alpha": {"min": 1.5, "max": 3.0},
    "unitRainfall": {"min": 1, "max": 100},  # mm
    "timeLag": {"min": 0.1, "max": 48},  # jam
    "riverLength": {"min": 0.1, "max": 1000},  # km
}
