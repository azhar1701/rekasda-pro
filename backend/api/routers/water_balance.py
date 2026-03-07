from fastapi import APIRouter, HTTPException, status
from typing import List

from api.schemas.water_balance import (
    DependableFlowRequest, DependableFlowResponse, 
    MonthlyDependableFlowRequest, 
    IrrigationDemandRequest, IrrigationMonthlyResult,
    NeracaAirRequest, NeracaAirFinalRow,
    FJMockRequest, FJMockResponse
)

from rekasda_engine.water_balance.dependable_flow import dependable_flow, monthly_dependable_flow
from rekasda_engine.water_balance.irrigation import calculate_irrigation_demand, calculate_raw_water_demand, calculate_neraca_air_final
from rekasda_engine.water_balance.fj_mock import calculate_fj_mock, calculate_weibull_dependable_flow

router = APIRouter()

@router.post(
    "/fj-mock",
    response_model=FJMockResponse,
    summary="Simulasi Hujan Aliran F.J. Mock",
    description="Menghitung ketersediaan air bulanan dengan metode Mock dan Debit Andalan Weibull."
)
async def simulate_fj_mock(request: FJMockRequest):
    try:
        results_mock = calculate_fj_mock(
            request.params.model_dump(),
            [d.model_dump() for d in request.data]
        )
        
        discharges = [r['discharge'] for r in results_mock]
        weibull = calculate_weibull_dependable_flow(discharges, 80)
        
        return FJMockResponse(
            monthlyResults=results_mock,
            qAndalan=weibull['qAndalan'],
            probability=weibull['probability']
        )
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
    "/debit-andalan",
    response_model=DependableFlowResponse,
    summary="Kalkulasi Debit Andalan (Q80)",
    description="Menghitung Debit Andalan menggunakan metode Weibull dari data run-off historis."
)
async def calculate_dependable_flow(request: DependableFlowRequest):
    try:
        result = dependable_flow(
            discharge_data=request.discharge_data,
            probability=request.probability
        )
        return DependableFlowResponse(**result)
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
    "/debit-andalan-bulanan",
    response_model=List[float],
    summary="Konversi Data Harian ke Debit Andalan Bulanan",
)
async def calculate_dependable_flow_monthly(request: MonthlyDependableFlowRequest):
    try:
        result = monthly_dependable_flow(
            daily_data=request.daily_data,
            days_per_month=request.days_per_month
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )

@router.post(
    "/kebutuhan-irigasi",
    response_model=List[IrrigationMonthlyResult],
    summary="Kebutuhan Air Irigasi (NFR & DR)",
    description="Menghitung kebutuhan bersih di sawah (NFR) dan kebutuhan pengambilan (DR)."
)
async def calculate_irrigation(request: IrrigationDemandRequest):
    try:
        input_data = [d.model_dump() for d in request.data]
        result = calculate_irrigation_demand(
            luas_irigasi=request.luas_irigasi,
            efisiensi=request.efisiensi,
            data=input_data
        )
        return result
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
    response_model=List[NeracaAirFinalRow],
    summary="Kalkulasi Neraca Air Final (12 Bulan)",
    description="Menghitung Ketersediaan (Supply) vs Kebutuhan (Irrigation, Raw Water, Environment)."
)
async def calculate_neraca(request: NeracaAirRequest):
    try:
        raw_demand = calculate_raw_water_demand(
            populasi=request.populasi,
            standar_domestik=request.standar_domestik,
            industri_m3s=request.industri_m3s
        )
        result = calculate_neraca_air_final(
            supply=request.supply,
            irrigation_dr=request.irrigation_dr,
            raw_water_demand=raw_demand
        )
        return result
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
