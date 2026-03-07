from fastapi import APIRouter, HTTPException, status
from api.schemas.rainfall import ABMRequest, ABMResponse, TcRequest, TcResponse

from rekasda_engine.rainfall.abm import generate_hyetograph
from rekasda_engine.rainfall.time_of_concentration import time_of_concentration

router = APIRouter()

@router.post(
    "/abm",
    response_model=ABMResponse,
    summary="Distribusi Hujan Jam-jaman (ABM)",
    description="Menghitung distribusi hujan per jam menggunakan metode Alternating Block Method (ABM) dan intensitas Mononobe."
)
async def calculate_abm(request: ABMRequest):
    try:
        # Engine call
        result = generate_hyetograph(R24=request.r24, duration=request.duration)
        return ABMResponse(**result)
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
    "/tc",
    response_model=TcResponse,
    summary="Waktu Konsentrasi (Tc)",
    description="Menghitung Waktu Konsentrasi (Time of Concentration) menggunakan berbagai metode empiris."
)
async def calculate_tc(request: TcRequest):
    try:
        result = time_of_concentration(
            method=request.method,
            L=request.L,
            S=request.S,
            A=request.A,
            H=request.H
        )
        return TcResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )
