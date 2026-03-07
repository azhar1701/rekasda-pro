from __future__ import annotations
from typing import TypedDict, List, Optional
import numpy as np

class HydrographPoint(TypedDict):
    time: float
    discharge: float

class ConvolutionResult(TypedDict):
    flood_hydrograph: List[HydrographPoint]
    peak_discharge: float
    time_to_peak: float
    total_volume: float
    component_hydrographs: List[List[HydrographPoint]]

def convolve_unit_hydrograph(unit_hydrograph: List[HydrographPoint], effective_rainfall: List[float], time_step: float) -> ConvolutionResult:
    """
    Perform discrete convolution of a Unit Hydrograph with effective rainfall.
    Q(n) = Σ P_eff(m) × U(n - m + 1)
    """
    if len(unit_hydrograph) < 2:
        raise ValueError("Unit Hydrograph harus memiliki minimal 2 ordinat.")
    if len(effective_rainfall) < 1:
        raise ValueError("Hujan efektif harus memiliki minimal 1 interval.")
    if time_step <= 0:
        raise ValueError("Time step harus > 0 jam.")
        
    N = len(unit_hydrograph)
    M = len(effective_rainfall)
    L = N + M - 1
    
    U = [p["discharge"] for p in unit_hydrograph]
    Q = [0.0] * L
    component_hydrographs: List[List[HydrographPoint]] = []
    
    for m in range(M):
        P = effective_rainfall[m]
        component: List[HydrographPoint] = []
        for k in range(N):
            n = m + k
            contribution = P * U[k]
            Q[n] += contribution
            component.append({
                "time": round(float(n * time_step), 2),
                "discharge": round(float(contribution), 4)
            })
        component_hydrographs.append(component)
        
    flood_hydrograph: List[HydrographPoint] = []
    peak_discharge = 0.0
    time_to_peak = 0.0
    
    for i, q in enumerate(Q):
        time = i * time_step
        flood_hydrograph.append({
            "time": round(float(time), 2),
            "discharge": round(float(q), 4)
        })
        if q > peak_discharge:
            peak_discharge = q
            time_to_peak = time
            
    # Calculate total volume (trapezoidal rule)
    # Volume = Σ (Qi + Qi+1) / 2 * dt * 3600
    total_volume = 0.0
    for i in range(len(flood_hydrograph) - 1):
        avg_q = (flood_hydrograph[i]["discharge"] + flood_hydrograph[i+1]["discharge"]) / 2.0
        total_volume += avg_q * time_step * 3600
        
    return {
        "flood_hydrograph": flood_hydrograph,
        "peak_discharge": round(float(peak_discharge), 4),
        "time_to_peak": round(float(time_to_peak), 2),
        "total_volume": round(float(total_volume), 2),
        "component_hydrographs": component_hydrographs
    }

def resample_unit_hydrograph(uh: List[HydrographPoint], new_step: float) -> List[HydrographPoint]:
    """
    Resample a unit hydrograph to a different time step using linear interpolation.
    """
    if len(uh) < 2 or new_step <= 0:
        return uh
        
    max_time = uh[-1]["time"]
    resampled: List[HydrographPoint] = []
    
    t = 0.0
    while t <= max_time + 0.0001:
        # Find bracketing points
        lower = uh[0]
        upper = uh[1]
        
        for i in range(len(uh) - 1):
            if uh[i]["time"] <= t <= uh[i+1]["time"]:
                lower = uh[i]
                upper = uh[i+1]
                break
                
        # Linear interpolation
        dt = upper["time"] - lower["time"]
        if dt > 0:
            q = lower["discharge"] + ((upper["discharge"] - lower["discharge"]) * (t - lower["time"])) / dt
        else:
            q = lower["discharge"]
            
        resampled.append({
            "time": round(float(t), 2),
            "discharge": round(float(max(0.0, q)), 4)
        })
        t += new_step
        
    return resampled

def compute_design_flood_hydrograph(unit_hydrograph: List[HydrographPoint], abm_rainfall: List[float], uh_time_step: float = 1.0) -> ConvolutionResult:
    """
    Convenience wrapper for ABM rainfall and unit hydrograph convolution.
    """
    rainfall_interval = 1.0 # ABM is always hourly
    
    uh = unit_hydrograph
    step = uh_time_step
    
    if abs(uh_time_step - rainfall_interval) > 0.01:
        uh = resample_unit_hydrograph(unit_hydrograph, rainfall_interval)
        step = rainfall_interval
        
    return convolve_unit_hydrograph(uh, abm_rainfall, step)
