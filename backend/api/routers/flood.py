from fastapi import APIRouter, HTTPException, status
from api.schemas.flood import ModifiedRationalRequest, DesignFloodIndoResponse, NakayasuRequest, NakayasuResponse

from rekasda_engine.flood.modified_rational import calculate_design_flood_indo
from rekasda_engine.flood.nakayasu import hss_nakayasu

router = APIRouter()

@router.post(
    "/rasional-modifikasi",
    response_model=DesignFloodIndoResponse,
    summary="Kalkulasi Debit Puncak (Modified Rational)",
    description="Menghitung Debit Puncak dengan metode rasional yang dimodifikasi (Melchior, der Weduwen, Haspers & Osugi) berdasarkan Luas DAS."
)
async def calculate_modified_rational(request: ModifiedRationalRequest):
    try:
        inputs = request.model_dump()
        result = calculate_design_flood_indo(inputs)
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
    "/nakayasu",
    response_model=NakayasuResponse,
    summary="Hidrograf Satuan Sintetik (HSS) Nakayasu",
    description="Menghitung dan membuat kurva hidrograf satuan sintetik menggunakan metode Nakayasu."
)
async def calculate_nakayasu(request: NakayasuRequest):
    try:
        result = hss_nakayasu(
            Ro=request.Ro,
            Tg=request.Tg,
            Tr=request.Tr,
            Alpha=request.Alpha,
            A=request.A,
            L=request.L
        )
        return dict(result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Engine Error: {str(e)}"
        )
