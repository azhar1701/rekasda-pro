from __future__ import annotations
from typing import TypedDict, List, Dict, Optional, Literal

# Common Base Models
class CalculationResult(TypedDict):
    success: bool
    errors: List[str]
    warnings: List[str]
    metadata: Dict[str, any]

# Statistics Models
class StatisticalParams(TypedDict):
    mean: float
    std_dev: float
    cv: float
    cs: float
    ck: float
    n: int

class DesignRainfallValue(TypedDict):
    return_period: int
    value: float
    label: str

class FrequencyResult(TypedDict):
    method: Literal['normal', 'lognormal', 'gumbel', 'logpearson3']
    values: List[DesignRainfallValue]
    params: StatisticalParams

# Rainfall Models
class HyetographRow(TypedDict):
    hour: int
    intensity: float
    cumulative: float
    incremental: float
    abm: float

class ABMResult(TypedDict):
    rows: List[HyetographRow]
    peak_hour: int
    peak_rainfall: float
    total_rainfall: float

# Flood Models
class HydrographPoint(TypedDict):
    time: float
    discharge: float

class FloodResult(TypedDict):
    method: str
    peak_discharge: float
    time_to_peak: float
    base_time: float
    hydrograph: List[HydrographPoint]
    metadata: Dict[str, any]

# Hydraulics Models
class ManningResult(TypedDict):
    velocity: float
    discharge: float
    froude_number: float
    reynolds_number: float
    shear_stress: float
    area: float
    perimeter: float
    hydraulic_radius: float
    flow_type: str
    stability: str
    safety_status: str
    freeboard: float
    warnings: List[str]
