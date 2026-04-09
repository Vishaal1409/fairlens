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


@app.get("/", tags=["health"])
def root():
    return {"message": "FairLens API is running 🚀"}
