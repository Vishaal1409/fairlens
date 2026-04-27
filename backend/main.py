"""
FairLens – FastAPI entry point
"""

import datetime
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

# root_path tells FastAPI it is mounted at /backend (for docs, redirects, OpenAPI)
app = FastAPI(
    title="FairLens API",
    version="0.2.0",
)

# TODO (team): Confirm with Ishitha/Shruthika if there are additional
# frontend URLs (e.g. Vercel / Netlify). Add them to CORS_ORIGINS env var on Render.
#
# Override at runtime via comma-separated CORS_ORIGINS env var, e.g.:
#   CORS_ORIGINS=https://fairlens.vercel.app,https://fairlens.netlify.app
_default_origins = [
    "https://vishaal1409.github.io",  # deployed GitHub Pages frontend
    "http://localhost:5173",          # Vite dev server
    "http://127.0.0.1:5173",         # Vite alt address
    "http://localhost:3000",          # fallback local
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
    allow_headers=[
        "Content-Type",       # JSON bodies + multipart/form-data (upload, upload-model)
        "Accept",             # response format negotiation
        "Authorization",      # future auth header
        "X-Requested-With",   # sent by some XHR/Axios clients
    ],
)

# Mount all routes from api/routes.py
app.include_router(router)


@app.get("/", tags=["health"])
def root():
    return {"message": "FairLens API is running 🚀"}


@app.get("/health", tags=["health"])
def health_check():
    dependencies = {}
    status_flag = "healthy"

    # --- aif360 ---
    try:
        import aif360
        dependencies["aif360"] = getattr(aif360, "__version__", "installed")
    except ImportError:
        dependencies["aif360"] = "missing"
        status_flag = "degraded"

    # --- fairlearn ---
    try:
        import fairlearn
        dependencies["fairlearn"] = getattr(fairlearn, "__version__", "installed")
    except ImportError:
        dependencies["fairlearn"] = "missing"
        status_flag = "degraded"

    # --- shap ---
    try:
        import shap
        dependencies["shap"] = getattr(shap, "__version__", "installed")
    except ImportError:
        dependencies["shap"] = "missing"
        status_flag = "degraded"

    return {
        "status": status_flag,
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "dependencies": dependencies,
        "detail": "Some optional ML dependencies are missing."
        if status_flag == "degraded"
        else "All systems operational 🚀"
    }