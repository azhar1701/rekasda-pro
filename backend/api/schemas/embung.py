from pydantic import BaseModel, Field, conlist
from typing import List, Optional, Any

# ==========================================
# Capacity (Sequent Peak)
# ==========================================
class SequentPeakRequest(BaseModel):
    inflow: conlist(float, min_length=1) = Field(..., description="Daftar inflow per periode")
    outflow: conlist(float, min_length=1) = Field(..., description="Daftar outflow per periode")

class MassCurvePoint(BaseModel):
    period: int
    month: str
    cumulativeInflow: float
    cumulativeOutflow: float
    cumulativeNetFlow: float

class SequentPeakResponse(BaseModel):
    netFlow: List[float]
    cumulativeNetFlow: List[float]
    sequentPeak: List[float]
    requiredStorage: List[float]
    maxStorageRequired: float
    massCurveData: List[MassCurvePoint]

# ==========================================
# Sedimentation
# ==========================================
class SedimentationRequest(BaseModel):
    qData: conlist(float, min_length=2) = Field(..., description="Data Debit (Q)")
    qsData: conlist(float, min_length=2) = Field(..., description="Data Sedimen Suspensi (Qs)")
    luasDas: float = Field(..., description="Luas DAS (km2)", gt=0)
    beratJenis: float = Field(..., description="Berat Jenis Sedimen (ton/m3)", gt=0)
    bedLoadPercentage: float = Field(..., description="Persentase Sedimen Dasar (0-100)", ge=0, le=100)
    flowDurationDays: Optional[List[float]] = None
    flowDurationQ: Optional[List[float]] = None

class SedimentYieldResponse(BaseModel):
    a: float
    b: float
    suspendedLoadTonnes: float
    bedLoadTonnes: float
    totalLoadTonnes: float
    totalVolumeM3: float
    erosionRateMm: float
    specificYield: float

# ==========================================
# Water Balance (Reservoir Operation)
# ==========================================
class ReservoirOperationRequest(BaseModel):
    initialStorage: float = Field(0.0, ge=0)
    inflows: List[float]
    demands: List[float]
    evaporation: List[float]
    infiltration: List[float]
    sMax: float = Field(..., gt=0)
    sMin: float = Field(..., ge=0)

class ReservoirOperationStep(BaseModel):
    period: int
    initialStorage: float
    inflow: float
    demand: float
    evaporation: float
    infiltration: float
    finalStorage: float
    spillVolume: float
    deficitVolume: float
    actualRelease: float
    status: str

class ReservoirOperationResponse(BaseModel):
    steps: List[ReservoirOperationStep]
    totalSpill: float
    totalDeficit: float
    reliability: float

# ==========================================
# Flood Routing (Level-Pool)
# ==========================================
class CurvePoint(BaseModel):
    x: float
    y: float

class HydrographPoint(BaseModel):
    time: float
    discharge: float

class StageStorageCurve(BaseModel):
    elevation: List[float]
    area: List[float]
    storage: List[float]

class StageDischargeCurve(BaseModel):
    elevation: List[float]
    discharge: List[float]

class FloodRoutingRequest(BaseModel):
    inflowHydrograph: List[HydrographPoint]
    stageStorageCurve: StageStorageCurve
    stageDischargeCurve: StageDischargeCurve
    deltaT: float = Field(..., gt=0)
    initialElevation: float

class RoutingTimeStep(BaseModel):
    time: float
    inflowAvg: float
    outflow: float
    storage: float
    elevation: float

class FloodRoutingResponse(BaseModel):
    steps: List[RoutingTimeStep]
    peakInflow: float
    peakOutflow: float
    maxElevation: float
    maxStorage: float
    attenuationRatio: float
