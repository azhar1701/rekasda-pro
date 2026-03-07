from typing import List, TypedDict

class ReservoirOperationStep(TypedDict):
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

class ReservoirOperationResult(TypedDict):
    steps: List[ReservoirOperationStep]
    totalSpill: float
    totalDeficit: float
    reliability: float

def simulate_reservoir_operation(
    initialStorage: float,
    inflows: List[float],
    demands: List[float],
    evaporation: List[float],
    infiltration: List[float],
    sMax: float,
    sMin: float
) -> ReservoirOperationResult:

    if not (len(inflows) == len(demands) == len(evaporation) == len(infiltration)):
        raise ValueError("Panjang array inflow, demand, evaporation, dan infiltration harus sama.")

    currentStorage = initialStorage
    steps: List[ReservoirOperationStep] = []
    totalSpill = 0.0
    totalDeficit = 0.0
    fulfilledPeriods = 0

    for t in range(len(inflows)):
        I = inflows[t]
        D = demands[t]
        E = evaporation[t]
        Inf = infiltration[t]

        storageStart = currentStorage

        S_t = currentStorage + I - D - E - Inf

        spill = 0.0
        deficit = 0.0
        actualRelease = D

        if S_t > sMax:
            spill = S_t - sMax
            S_t = sMax
        
        if S_t < sMin:
            deficit = sMin - S_t
            S_t = sMin
            actualRelease = max(0.0, D - deficit)

        status = 'Normal'
        if spill > 0:
            status = 'Limpasan'
        elif deficit > 0:
            status = 'Defisit'
        elif actualRelease >= D and S_t > sMin * 1.5:
            status = 'Surplus'

        if deficit == 0:
            fulfilledPeriods += 1
            
        totalSpill += spill
        totalDeficit += deficit

        steps.append({
            "period": t,
            "initialStorage": storageStart,
            "inflow": I,
            "demand": D,
            "evaporation": E,
            "infiltration": Inf,
            "finalStorage": S_t,
            "spillVolume": spill,
            "deficitVolume": deficit,
            "actualRelease": actualRelease,
            "status": status
        })

        currentStorage = S_t

    reliability = (fulfilledPeriods / len(inflows)) * 100 if len(inflows) > 0 else 0

    return {
        "steps": steps,
        "totalSpill": totalSpill,
        "totalDeficit": totalDeficit,
        "reliability": reliability
    }
