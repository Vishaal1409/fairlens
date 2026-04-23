"""
FairLens – FastAPI entry point
"""

import datetime
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(
    title="FairLens API",
    version="0.2.0",
)

# Pin allowed origins. Override via CORS_ORIGINS env var (comma-separated).
_default_origins = [
    "https://vishaal1409.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_origins_env = os.getenv("CORS_ORIGINS")
_allowed_origins = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else _default_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Mount all routes from api/routes.py
app.include_router(router)


@app.get("/", tags=["health"])
def root():
    return {"message": "FairLens API is running 🚀"}


@app.get("/health", tags=["health"])
def health_check():
    dependencies = {}
    status_flag = "ok"

    try:
        import aif360
        dependencies["aif360"] = getattr(aif360, "__version__", "installed")
    except ImportError:
        status_flag = "degraded"
        dependencies["aif360"] = "missing"

    try:
        import fairlearn
        dependencies["fairlearn"] = getattr(fairlearn, "__version__", "installed")
    except ImportError:
        status_flag = "degraded"
        dependencies["fairlearn"] = "missing"

    try:
        import shap
        dependencies["shap"] = getattr(shap, "__version__", "installed")
    except ImportError:
        status_flag = "degraded"
        dependencies["shap"] = "missing"

    response = {
        "status": status_flag,
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "dependencies": dependencies,
    }

    if status_flag != "ok":
        response["detail"] = "One or more ML dependencies failed to load."
        raise HTTPException(status_code=503, detail=response)

    return response
