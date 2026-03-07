from fastapi import APIRouter, HTTPException, status
from typing import List

from api.schemas.hydrology import FrequencyAnalysisRequest, FrequencyAnalysisResponse
from rekasda_engine.statistics.frequency import frequency_analysis

# Inisialisasi router khusus modul Hidrologi
router = APIRouter()

@router.post(
    "/frekuensi",
    response_model=FrequencyAnalysisResponse,
    summary="Kalkulasi Analisis Frekuensi (Distribusi Normal, Gumbel, Log Pearson III)",
    description="Menerima input curah hujan harian historis dan mereturn parameter statistik tiap metode."
)
async def calculate_frequency(request: FrequencyAnalysisRequest):
    data = request.rainfall_data
    
    # Validasi Dasar: Minimal 10 tahun wajib, idealnya 15+ tahun
    if len(data) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data curah hujan minimum 10 tahun tidak terpenuhi. (Jumlah dikirim: {len(data)})"
        )
        
    try:
        # Panggil fungsi core engine dari folder rekasda_engine
        # Karena ini CPU bound, jika dataset besar, bisa dieksekusi via run_in_executor
        results = frequency_analysis(data, return_periods=request.return_periods)
        
        return FrequencyAnalysisResponse(
            success=True,
            station_name=request.station_name,
            results=results
        )
        
    except Exception as e:
        # Defensive Error Handling
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat kalkulasi engine: {str(e)}"
        )
