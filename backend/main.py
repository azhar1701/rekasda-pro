import os
import time
import sentry_sdk
from loguru import logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration

from api.routers import hydrology, rainfall, flood, embung, water_balance, tasks

# Initialize Sentry
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )
    logger.info("Sentry initialized")

# Configure Loguru
logger.add("logs/backend.log", rotation="10 MB", retention="10 days", level="INFO")

app = FastAPI(
    title="RekaSDA Pro Computational Engine",
    description="REST API for Hydrology, Sedimentation, and Spatial Engine Computations",
    version="1.0.0",
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {process_time:.2f}ms"
    )
    return response

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
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Background Tasks"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "RekaSDA Python Engine is running."}
