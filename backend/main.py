from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import hydrology, rainfall, flood, embung, water_balance

app = FastAPI(
    title="RekaSDA Pro Computational Engine",
    description="REST API for Hydrology, Sedimentation, and Spatial Engine Computations",
    version="1.0.0",
)

# Konfigurasi CORS Middleware
# Mengizinkan frontend (yang mungkin berada di Origin/Port berbeda) untuk mengakses API tanpa diblokir
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pada production, ganti dengan domain frontend yang valid
    allow_credentials=True,
    allow_methods=["*"],  # Mengizinkan semua method HTTP (GET, POST, PUT, DELETE, dsb)
    allow_headers=["*"],
)

# Registrasi Router / Endpoint
app.include_router(hydrology.router, prefix="/api/v1/hidrologi", tags=["Hidrologi"])
app.include_router(rainfall.router, prefix="/api/v1/hujan", tags=["Hujan"])
app.include_router(flood.router, prefix="/api/v1/banjir", tags=["Banjir"])
app.include_router(embung.router, prefix="/api/v1/embung", tags=["Embung"])
app.include_router(water_balance.router, prefix="/api/v1/neraca-air", tags=["Neraca Air"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "RekaSDA Python Engine is running."}
