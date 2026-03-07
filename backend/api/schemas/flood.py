from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# ==========================================
# Modified Rational Schemas
# ==========================================
class ModifiedRationalRequest(BaseModel):
    luasDasKm2: float = Field(..., description="Luas DAS (A) dalam km2", gt=0)
    panjangSungaiUtamaKm: float = Field(..., description="Panjang Sungai (L) dalam km", gt=0)
    kemiringanSungai: float = Field(..., description="Kemiringan (S) dalam m/m", gt=0)
    curahHujanHarianMaksimum: float = Field(..., description="Curah hujan desain 24 jam (R24) dalam mm", gt=0)
    koefisienPengaliran: float = Field(0.7, description="Basis Koefisien Pengaliran (C)")

class ModifiedRationalMethodResult(BaseModel):
    method: str
    qPeak: float
    tc: float
    alpha: Optional[float]
    beta: Optional[float]
    C: float
    intensity: float
    warnings: List[str]
    metadata: Dict[str, Any]

class DesignFloodIndoResponse(BaseModel):
    recommended: ModifiedRationalMethodResult
    alternatives: List[ModifiedRationalMethodResult]
    areaAnalysis: Dict[str, Any]

# ==========================================
# HSS Nakayasu Schemas
# ==========================================
class NakayasuRequest(BaseModel):
    Ro: float = Field(..., description="Hujan efektif (Ro) dalam mm", gt=0)
    Tg: Optional[float] = Field(None, description="Time of lag (jam). Jika null akan dihitung otomatis.")
    Tr: float = Field(..., description="Satuan waktu hujan (jam)")
    Alpha: float = Field(2.0, description="Konstanta Nakayasu (biasanya 2.0)", gt=0)
    A: float = Field(..., description="Luas DAS dalam km2", gt=0)
    L: float = Field(..., description="Panjang sungai utama dalam km", gt=0)

class HydrographPoint(BaseModel):
    time: float
    discharge: float

class NakayasuResponse(BaseModel):
    Qp: float
    Tp: float
    Tb: float
    hydrograph: List[HydrographPoint]
