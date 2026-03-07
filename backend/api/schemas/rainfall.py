from pydantic import BaseModel, Field
from typing import List, Dict, Any

# ==========================================
# ABM (Alternating Block Method) Schemas
# ==========================================
class ABMRequest(BaseModel):
    r24: float = Field(..., description="Hujan harian rencana (R24) dalam mm", gt=0)
    duration: int = Field(6, description="Durasi hujan dalam jam (1-24)", ge=1, le=24)

class ABMRow(BaseModel):
    jam: int
    intensitas: float
    kumulatif: float
    inkremental: float
    abm: float

class ABMResponse(BaseModel):
    durasi: int
    r24: float
    rows: List[ABMRow]
    jamPuncak: int
    hujanPuncak: float
    totalHujan: float

# ==========================================
# Time of Concentration (Tc) Schemas
# ==========================================
class TcRequest(BaseModel):
    method: str = Field(default="kirpich", description="Metode kalkulasi: kirpich, bransby-williams, california")
    L: float = Field(0.0, description="Panjang lintasan utama/sungai (km)")
    S: float = Field(0.0, description="Kemiringan dasar saluran rata-rata (m/m)")
    A: float = Field(default=0.0, description="Luas DAS (km2) - khusus Bransby-Williams")
    H: float = Field(default=0.0, description="Beda tinggi (m) - khusus California")

class TcResponse(BaseModel):
    method: str
    tc_minutes: float
    tc_hours: float
