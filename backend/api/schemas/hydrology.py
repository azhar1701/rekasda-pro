from pydantic import BaseModel, conlist, Field
from typing import List, Dict

# Skema Input Request
class FrequencyAnalysisRequest(BaseModel):
    station_name: str = Field(..., example="Stasiun A")
    # Memastikan array curah hujan harian (minimal 10 tahun data agar valid secara statistik)
    rainfall_data: conlist(float, min_length=10) = Field(
        ..., 
        description="Deret data hujan tahunan maksimum (minimal 10 data)",
        example=[120.5, 95.0, 142.3, 110.1, 85.5, 134.2, 105.8, 122.4, 98.7, 115.6]
    )
    return_periods: List[int] = Field(
        default=[2, 5, 10, 25, 50, 100],
        description="Kala ulang (return period) dalam tahun yang ingin dihitung"
    )

class StatisticalParams(BaseModel):
    mean: float
    std_dev: float
    cv: float
    cs: float
    ck: float
    n: int

class DesignValue(BaseModel):
    return_period: int
    frequency: float
    design_value: float

class FrequencyMethodResult(BaseModel):
    method: str
    parameters: StatisticalParams
    design_values: List[DesignValue]

# Skema Output Response
class FrequencyAnalysisResponse(BaseModel):
    success: bool
    station_name: str
    results: List[FrequencyMethodResult]
