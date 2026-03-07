from typing import List, Dict, TypedDict

class RoutingTimeStep(TypedDict):
    time: float
    inflowAvg: float
    outflow: float
    storage: float
    elevation: float

class FloodRoutingResult(TypedDict):
    steps: List[RoutingTimeStep]
    peakInflow: float
    peakOutflow: float
    maxElevation: float
    maxStorage: float
    attenuationRatio: float

class CurvePoint(TypedDict):
    x: float
    y: float

class HydrographPoint(TypedDict):
    time: float
    discharge: float

class StageStorageCurve(TypedDict):
    elevation: List[float]
    area: List[float]
    storage: List[float]

class StageDischargeCurve(TypedDict):
    elevation: List[float]
    discharge: List[float]

def linear_interpolate(curve: List[CurvePoint], x_val: float) -> float:
    if not curve:
        return 0.0
    if x_val <= curve[0]["x"]:
        return curve[0]["y"]
    if x_val >= curve[-1]["x"]:
        return curve[-1]["y"]
        
    for i in range(len(curve) - 1):
        if curve[i]["x"] <= x_val <= curve[i+1]["x"]:
            x1, y1 = curve[i]["x"], curve[i]["y"]
            x2, y2 = curve[i+1]["x"], curve[i+1]["y"]
            if x2 == x1:
                return y1
            return y1 + ((y2 - y1) / (x2 - x1)) * (x_val - x1)
    
    return curve[-1]["y"]

def outflowFromElevation(elevDischargeCurve: List[CurvePoint], elevation: float) -> float:
    return linear_interpolate(elevDischargeCurve, elevation)
    
def storageFromElevation(elevStorageCurve: List[CurvePoint], elevation: float) -> float:
    return linear_interpolate(elevStorageCurve, elevation)

def inflowAtTime(hydrographCurve: List[CurvePoint], time: float) -> float:
    return linear_interpolate(hydrographCurve, time)

def calculate_flood_routing(
    inflowHydrograph: List[HydrographPoint],
    stageStorageCurve: StageStorageCurve,
    stageDischargeCurve: StageDischargeCurve,
    deltaT: float,
    initialElevation: float
) -> FloodRoutingResult:

    if len(inflowHydrograph) < 2:
        raise ValueError("Hidrograf inflow membutuhkan minimal 2 titik.")

    elevStorageCurve = [
        {"x": e, "y": s} for e, s in zip(stageStorageCurve["elevation"], stageStorageCurve["storage"])
    ]
    # Sumbu X = Elevasi, Sumbu Y = Storage. Interpolasi biasa butuh X sebagai dependent, but here elevation is input to get Storage
    # Let's adjust helper logic to strictly be (x_to_lookup, list of points where x is the input feature to interpolate)
    
    # Actually storageFromElevation needs Elevation -> Storage, so X=Elevation, Y=Storage
    
    elevDischargeCurve = [
        {"x": e, "y": d} for e, d in zip(stageDischargeCurve["elevation"], stageDischargeCurve["discharge"])
    ]

    auxiliaryCurve: List[CurvePoint] = []
    # phi_2 = S/dt + O/2 -> Elevation
    for i, elev in enumerate(stageStorageCurve["elevation"]):
        S = stageStorageCurve["storage"][i]
        O = outflowFromElevation(elevDischargeCurve, elev)
        phi_2 = (S / deltaT) + (O / 2)
        auxiliaryCurve.append({"x": phi_2, "y": elev})
    
    hydrographCurve = [
        {"x": p["time"], "y": p["discharge"]} for p in inflowHydrograph
    ]
    
    endTime = inflowHydrograph[-1]["time"]
    currentElevation = initialElevation
    currentStorage = storageFromElevation(elevStorageCurve, currentElevation)
    currentOutflow = outflowFromElevation(elevDischargeCurve, currentElevation)
    
    steps: List[RoutingTimeStep] = []
    
    steps.append({
        "time": 0.0,
        "inflowAvg": inflowAtTime(hydrographCurve, 0.0),
        "outflow": currentOutflow,
        "storage": currentStorage,
        "elevation": currentElevation
    })
    
    peakInflow = 0.0
    peakOutflow = 0.0
    maxElevation = currentElevation
    maxStorage = currentStorage

    t = deltaT
    while t <= endTime:
        I1 = inflowAtTime(hydrographCurve, t - deltaT)
        I2 = inflowAtTime(hydrographCurve, t)
        Iavg = (I1 + I2) / 2.0
        
        psi_1 = (currentStorage / deltaT) - (currentOutflow / 2.0)
        phi_2 = Iavg + psi_1
        
        newElevation = linear_interpolate(auxiliaryCurve, phi_2)
        newStorage = storageFromElevation(elevStorageCurve, newElevation)
        newOutflow = outflowFromElevation(elevDischargeCurve, newElevation)
        
        steps.append({
            "time": t,
            "inflowAvg": Iavg,
            "outflow": newOutflow,
            "storage": newStorage,
            "elevation": newElevation
        })
        
        currentStorage = newStorage
        currentOutflow = newOutflow
        currentElevation = newElevation
        
        if Iavg > peakInflow: peakInflow = Iavg
        if newOutflow > peakOutflow: peakOutflow = newOutflow
        if newElevation > maxElevation: maxElevation = newElevation
        if newStorage > maxStorage: maxStorage = newStorage
        
        t += deltaT

    absolutePeakInflow = max(p["discharge"] for p in inflowHydrograph)
    if absolutePeakInflow > peakInflow:
        peakInflow = absolutePeakInflow

    attenuationRatio = (1 - (peakOutflow / peakInflow)) * 100 if peakInflow > 0 else 0

    return {
        "steps": steps,
        "peakInflow": peakInflow,
        "peakOutflow": peakOutflow,
        "maxElevation": maxElevation,
        "maxStorage": maxStorage,
        "attenuationRatio": attenuationRatio
    }
