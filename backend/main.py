"""
FairLens — FastAPI entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(title="FairLens API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routes from api/routes.py
app.include_router(router)

@app.get("/", tags=["health"])
def root():
    return {"message": "FairLens API is running 🚀"}

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "2.0.0", "project": "FairLens"}