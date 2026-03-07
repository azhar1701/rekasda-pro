import math
from typing import List, Optional, TypedDict

class SedimentYieldResult(TypedDict):
    a: float
    b: float
    suspendedLoadTonnes: float
    bedLoadTonnes: float
    totalLoadTonnes: float
    totalVolumeM3: float
    erosionRateMm: float
    specificYield: float

def calculate_sediment_yield(
    qData: List[float],
    qsData: List[float],
    luasDas: float,
    beratJenis: float,
    bedLoadPercentage: float,
    flowDurationDays: Optional[List[float]] = None,
    flowDurationQ: Optional[List[float]] = None
) -> SedimentYieldResult:

    if len(qData) != len(qsData) or len(qData) < 2:
        raise ValueError("Data Q dan Qs harus sama panjang dan minimal 2.")

    n = len(qData)
    sumLogQ = 0.0
    sumLogQs = 0.0
    sumLogQLogQs = 0.0
    sumLogQSquare = 0.0

    for i in range(n):
        logQ = math.log10(max(qData[i], 1e-10))
        logQs = math.log10(max(qsData[i], 1e-10))
        
        sumLogQ += logQ
        sumLogQs += logQs
        sumLogQLogQs += logQ * logQs
        sumLogQSquare += logQ * logQ

    numeratorB = n * sumLogQLogQs - sumLogQ * sumLogQs
    denominatorB = n * sumLogQSquare - sumLogQ * sumLogQ

    b = 1.0
    if denominatorB != 0:
        b = numeratorB / denominatorB

    logA = (sumLogQs - b * sumLogQ) / n
    a = math.pow(10, logA)

    suspendedLoadTonnes = 0.0
    if flowDurationQ and flowDurationDays and len(flowDurationQ) == len(flowDurationDays):
        for i in range(len(flowDurationQ)):
            Q = flowDurationQ[i]
            days = flowDurationDays[i]
            qs = a * math.pow(Q, b)
            suspendedLoadTonnes += qs * days
    else:
        avgQ = sum(qData) / n
        avgQs = a * math.pow(avgQ, b)
        suspendedLoadTonnes = avgQs * 365.0

    bedLoadFraction = bedLoadPercentage / 100.0
    bedLoadTonnes = suspendedLoadTonnes * bedLoadFraction
    totalLoadTonnes = suspendedLoadTonnes + bedLoadTonnes

    totalVolumeM3 = 0.0
    if beratJenis > 0:
        totalVolumeM3 = totalLoadTonnes / beratJenis

    erosionRateMm = 0.0
    specificYield = 0.0
    if luasDas > 0:
        luasDasM2 = luasDas * 1e6
        erosionRateMm = (totalVolumeM3 / luasDasM2) * 1000
        specificYield = totalLoadTonnes / luasDas

    return {
        "a": a,
        "b": b,
        "suspendedLoadTonnes": suspendedLoadTonnes,
        "bedLoadTonnes": bedLoadTonnes,
        "totalLoadTonnes": totalLoadTonnes,
        "totalVolumeM3": totalVolumeM3,
        "erosionRateMm": erosionRateMm,
        "specificYield": specificYield
    }
