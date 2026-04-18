"""
FairLens – FastAPI entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(title="FairLens API", version="0.2.0")

# Allow all origins for local development (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routes from api/routes.py (no prefix — keeps /upload and /analyze at root)
app.include_router(router)


import datetime
from fastapi import FastAPI, HTTPException

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
