from pydantic import BaseModel, Field, conlist
from typing import List, Optional, Literal

# ==========================================
# Dependable Flow Schemas
# ==========================================
class DependableFlowRequest(BaseModel):
    discharge_data: conlist(float, min_length=12) = Field(..., description="Data debit (minimal 12 data)")
    probability: float = Field(80.0, description="Persentase probabilitas andalan", gt=0, le=100)

class DependableFlowResponse(BaseModel):
    Q80: float
    Qavg: float
    Qmax: float
    Qmin: float
    data_count: int

# ==========================================
# Monthly Dependable Flow
# ==========================================
class MonthlyDependableFlowRequest(BaseModel):
    daily_data: List[float] = Field(..., description="Data debit harian")
    days_per_month: Optional[List[int]] = Field(
        default=[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    )

# ==========================================
# Irrigation Demand
# ==========================================
class IrrigationMonthlyInput(BaseModel):
    month: str
    daysInMonth: int
    polaTanam: Literal['padi', 'palawija', 'bero']
    kc: float
    perkolasi: float
    wlr: float
    rpiEfektif: float
    eto: float

class IrrigationDemandRequest(BaseModel):
    luas_irigasi: float = Field(..., gt=0)
    efisiensi: float = Field(..., gt=0, le=1.0)
    data: List[IrrigationMonthlyInput]

class IrrigationMonthlyResult(BaseModel):
    month: str
    polaTanam: str
    etc: float
    perkolasi: float
    wlr: float
    rpiEfektif: float
    nfr: float
    dr: float
    nfrLsHa: float

# ==========================================
# Neraca Air Final
# ==========================================
class NeracaAirRequest(BaseModel):
    supply: List[float] = Field(..., description="Array 12 bulan ketersediaan air (m³/s)")
    irrigation_dr: List[float] = Field(..., description="Array 12 bulan kebutuhan DR irigasi (m³/s)")
    populasi: float = Field(..., gt=0, description="Jumlah penduduk (jiwa)")
    standar_domestik: float = Field(..., gt=0, description="Standar kebutuhan air per orang (L/org/hari)")
    industri_m3s: float = Field(0.0, ge=0, description="Kebutuhan industri tambahan (m³/s)")

class MockMonthlyInput(BaseModel):
    month: str
    precipitation: float
    eto: float
    daysInMonth: int

class MockParams(BaseModel):
    luasDas: float
    smc: float
    ism: float
    infiltrationFactor: float
    k: float
    exposedSurface: float
    initialGwStorage: float = 0.0

class FJMockRequest(BaseModel):
    params: MockParams
    data: List[MockMonthlyInput]

class MockMonthlyResult(BaseModel):
    month: str
    precipitation: float
    eto: float
    deltaS: float
    soilMoisture: float
    eta: float
    waterSurplus: float
    infiltration: float
    gwStorage: float
    baseFlow: float
    directRunoff: float
    totalRunoff: float
    discharge: float
    daysInMonth: int

class FJMockResponse(BaseModel):
    monthlyResults: List[MockMonthlyResult]
    qAndalan: float
    probability: float

# ==========================================
# Neraca Air Final
# ==========================================
class NeracaAirFinalRow(BaseModel):
    month: str
    ketersediaan: float
    irigasi: float
    airBaku: float
    lingkungan: float
    totalKebutuhan: float
    neraca: float
    status: Literal['Surplus', 'Defisit', 'Seimbang']
