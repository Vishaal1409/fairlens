import uuid
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from io import StringIO

from backend.ml.analyzer import analyze

app = FastAPI(title="FairLens API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory file store (fine for hackathon)
FILE_STORE: dict[str, pd.DataFrame] = {}


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "FairLens API"}


# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    file_id = str(uuid.uuid4())
    FILE_STORE[file_id] = df

    return {
        "file_id":  file_id,
        "columns":  list(df.columns),
        "row_count": len(df),
        "preview":  df.head(5).to_dict(orient="records"),
    }


# ── Analyze ────────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    file_id:       str
    protected_col: str
    label_col:     str
    predicted_col: str


@app.post("/analyze")
def analyze_file(req: AnalyzeRequest):
    df = FILE_STORE.get(req.file_id)
    if df is None:
        raise HTTPException(status_code=404, detail="file_id not found. Please upload again.")

    for col in [req.protected_col, req.label_col, req.predicted_col]:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{col}' not found in uploaded file.")

    try:
        result = analyze(df, req.protected_col, req.label_col, req.predicted_col)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    return result


# ── Run locally ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)