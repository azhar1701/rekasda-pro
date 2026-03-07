from typing import List, Dict, TypedDict

class MassCurvePoint(TypedDict):
    period: int
    month: str
    cumulativeInflow: float
    cumulativeOutflow: float
    cumulativeNetFlow: float

class SequentPeakResult(TypedDict):
    netFlow: List[float]
    cumulativeNetFlow: List[float]
    sequentPeak: List[float]
    requiredStorage: List[float]
    maxStorageRequired: float
    massCurveData: List[MassCurvePoint]


MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'
]

def calculate_sequent_peak(inflow: List[float], outflow: List[float]) -> SequentPeakResult:
    if not inflow:
        raise ValueError("Array inflow tidak boleh kosong.")
    if len(inflow) != len(outflow):
        raise ValueError(f"Panjang array inflow ({len(inflow)}) dan outflow ({len(outflow)}) harus sama.")
    
    for i in range(len(inflow)):
        if inflow[i] < 0:
            raise ValueError(f"Inflow pada periode {i} tidak boleh negatif.")
        if outflow[i] < 0:
            raise ValueError(f"Outflow pada periode {i} tidak boleh negatif.")

    n = len(inflow)
    netFlow = [0.0] * n
    cumulativeNetFlow = [0.0] * n
    sequentPeak = [0.0] * n
    requiredStorage = [0.0] * n
    massCurveData: List[MassCurvePoint] = []

    cumInflow = 0.0
    cumOutflow = 0.0
    cumNet = 0.0
    prevPeak = 0.0
    maxStorage = 0.0

    for i in range(n):
        nf = inflow[i] - outflow[i]
        netFlow[i] = nf

        cumInflow += inflow[i]
        cumOutflow += outflow[i]
        cumNet += nf
        cumulativeNetFlow[i] = cumNet

        scale_peak = prevPeak - nf
        peak = scale_peak if scale_peak > 0 else 0.0
        
        sequentPeak[i] = peak
        requiredStorage[i] = peak
        prevPeak = peak

        if peak > maxStorage:
            maxStorage = peak

        massCurveData.append({
            "period": i + 1,
            "month": MONTH_LABELS[i % len(MONTH_LABELS)],
            "cumulativeInflow": cumInflow,
            "cumulativeOutflow": cumOutflow,
            "cumulativeNetFlow": cumNet,
        })

    return {
        "netFlow": netFlow,
        "cumulativeNetFlow": cumulativeNetFlow,
        "sequentPeak": sequentPeak,
        "requiredStorage": requiredStorage,
        "maxStorageRequired": maxStorage,
        "massCurveData": massCurveData,
    }
