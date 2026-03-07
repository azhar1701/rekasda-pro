from fastapi import APIRouter, HTTPException, status
from api.schemas.embung import (
    SequentPeakRequest, SequentPeakResponse, 
    SedimentationRequest, SedimentYieldResponse,
    ReservoirOperationRequest, ReservoirOperationResponse,
    FloodRoutingRequest, FloodRoutingResponse
)

from rekasda_engine.embung.capacity import calculate_sequent_peak
from rekasda_engine.embung.sedimentation import calculate_sediment_yield
from rekasda_engine.embung.water_balance import simulate_reservoir_operation
from rekasda_engine.embung.routing import calculate_flood_routing

router = APIRouter()

@router.post(
    "/kapasitas",
    response_model=SequentPeakResponse,
    summary="Kalkulasi Kapasitas Waduk (Sequent Peak)",
    description="Menghitung volume tampungan efektif waduk menggunakan metode Rippl / Sequent Peak Algorithm."
)
async def calculate_capacity(request: SequentPeakRequest):
    try:
        result = calculate_sequent_peak(
            inflow=request.inflow,
            outflow=request.outflow
        )
        return SequentPeakResponse(**result)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )

@router.post(
    "/sedimen",
    response_model=SedimentYieldResponse,
    summary="Laju Erosi dan Sedimen",
    description="Menghitung Total Sedimen menggunakan Kurva Lengkung Sedimen (Rating Curve)."
)
async def calculate_sediment(request: SedimentationRequest):
    try:
        result = calculate_sediment_yield(
            qData=request.qData,
            qsData=request.qsData,
            luasDas=request.luasDas,
            beratJenis=request.beratJenis,
            bedLoadPercentage=request.bedLoadPercentage,
            flowDurationDays=request.flowDurationDays,
            flowDurationQ=request.flowDurationQ
        )
        return dict(result)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )

@router.post(
    "/neraca-air",
    response_model=ReservoirOperationResponse,
    summary="Simulasi Pola Operasi Waduk",
    description="Menyimulasikan Neraca Air Langkah Waktu pada Waduk."
)
async def simulate_reservoir(request: ReservoirOperationRequest):
    try:
        result = simulate_reservoir_operation(
            initialStorage=request.initialStorage,
            inflows=request.inflows,
            demands=request.demands,
            evaporation=request.evaporation,
            infiltration=request.infiltration,
            sMax=request.sMax,
            sMin=request.sMin
        )
        return dict(result)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )
