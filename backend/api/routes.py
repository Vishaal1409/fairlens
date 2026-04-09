"""
FairLens API routes
-------------------
/upload  – accept a CSV, store the DataFrame in memory, return metadata
/analyze – run Vishaal's fairness metrics on a previously uploaded file
"""

import uuid
import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional

from ml.analyzer import analyze

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared in-memory store  (file_id -> DataFrame)
# Populated by /upload, consumed by /analyze
# ---------------------------------------------------------------------------
uploaded_files: dict[str, pd.DataFrame] = {}


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@router.post("/upload", tags=["data"])
async def upload_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file and return metadata + a 5-row preview.

    Response shape (per API contract):
    {
        "file_id":   "abc123",
        "columns":   ["age", "gender", "income"],
        "preview":   [ ...first 5 rows as list of dicts... ],
        "row_count": 1000
    }
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}")

    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df          # ← store for /analyze

    return {
        "file_id":   file_id,
        "columns":   df.columns.tolist(),
        "preview":   df.head(5).to_dict(orient="records"),
        "row_count": len(df),
    }


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    file_id:       str
    protected_col: str
    label_col:     str
    predicted_col: str          # required by Vishaal's analyze()


@router.post("/analyze", tags=["fairness"])
def analyze_file(request: AnalyzeRequest):
    """
    Run Vishaal's fairness metrics on a previously uploaded CSV.

    Response shape (per API contract):
    {
        "metrics": {
            "demographic_parity": 0.82,
            "disparate_impact":   0.74,
            "equal_opportunity":  0.91
        },
        "protected_col": "gender",
        "status": "complete"
    }
    """
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail="File not found. Upload it first via POST /upload.",
        )

    df = uploaded_files[request.file_id]

    # Validate column names before handing off to the ML layer
    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
        "predicted_col": request.predicted_col,
    }.items():
        if col_val not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Column '{col_val}' (passed as {col_name}) not found. "
                    f"Available columns: {df.columns.tolist()}"
                ),
            )

    # Delegate to Vishaal's analyzer
    results = analyze(
        df,
        request.protected_col,
        request.label_col,
        request.predicted_col,
    )

    return {
        "metrics":       results,
        "protected_col": request.protected_col,
        "status":        "complete",
    }
