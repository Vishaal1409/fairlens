import uuid
import io
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FairLens API", version="0.1.0")

# Allow all origins for local development (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store: file_id -> DataFrame
_file_store: dict[str, pd.DataFrame] = {}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "FairLens API is running 🚀"}


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file and return metadata + a 5-row preview.

    Response shape (as per API contract):
    {
        "file_id": "abc123",
        "columns": ["age", "gender", "income"],
        "preview": [ ...first 5 rows as list of dicts... ],
        "row_count": 1000
    }
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {e}")

    file_id = uuid.uuid4().hex[:8]
    _file_store[file_id] = df

    return {
        "file_id": file_id,
        "columns": df.columns.tolist(),
        "preview": df.head(5).to_dict(orient="records"),
        "row_count": len(df),
    }


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    file_id: str
    protected_col: str
    label_col: str
    predicted_col: Optional[str] = None


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Run basic fairness metrics on a previously uploaded CSV.

    Response shape (as per API contract):
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
    df = _file_store.get(req.file_id)
    if df is None:
        raise HTTPException(status_code=404, detail="file_id not found. Please upload first.")

    for col in [req.protected_col, req.label_col]:
        if col not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=f"Column '{col}' not found in uploaded file. "
                       f"Available columns: {df.columns.tolist()}",
            )

    metrics = _compute_metrics(df, req.protected_col, req.label_col, req.predicted_col)

    return {
        "metrics": metrics,
        "protected_col": req.protected_col,
        "status": "complete",
    }


# ---------------------------------------------------------------------------
# Fairness metric helpers
# ---------------------------------------------------------------------------
def _compute_metrics(
    df: pd.DataFrame,
    protected_col: str,
    label_col: str,
    predicted_col: Optional[str],
) -> dict:
    """
    Compute three fairness metrics.

    All metrics compare two groups: privileged (majority positive-outcome group)
    vs. unprivileged.  Values range 0-1; closer to 1.0 = fairer.
    """
    groups = df[protected_col].unique()
    if len(groups) < 2:
        raise HTTPException(
            status_code=422,
            detail=f"Protected column '{protected_col}' has fewer than 2 unique values.",
        )

    # Use predicted column if supplied and present, else fall back to label
    outcome_col = predicted_col if (predicted_col and predicted_col in df.columns) else label_col

    # Positive-outcome rates per group
    rates = (
        df.groupby(protected_col)[outcome_col]
        .apply(lambda s: (s == 1).mean() if s.dtype != object else (s == s.mode()[0]).mean())
        .to_dict()
    )

    rate_values = list(rates.values())
    max_rate = max(rate_values)
    min_rate = min(rate_values)

    # Demographic Parity Difference  →  normalised to [0,1]
    dp_diff = abs(max_rate - min_rate)
    demographic_parity = round(1 - dp_diff, 4)

    # Disparate Impact  = min_rate / max_rate
    disparate_impact = round(min_rate / max_rate, 4) if max_rate > 0 else 0.0

    # Equal Opportunity (uses ground-truth label regardless of predicted_col)
    tpr_per_group: dict[str, float] = {}
    for grp, grp_df in df.groupby(protected_col):
        positives = grp_df[grp_df[label_col] == 1]
        if len(positives) == 0:
            tpr_per_group[grp] = 0.0
            continue
        if outcome_col in grp_df.columns and outcome_col != label_col:
            tpr = (positives[outcome_col] == 1).mean()
        else:
            # Self-check: trivially 1.0 when label == outcome; keep for API shape
            tpr = 1.0
        tpr_per_group[grp] = tpr

    tpr_values = list(tpr_per_group.values())
    eq_opp = round(1 - abs(max(tpr_values) - min(tpr_values)), 4) if tpr_values else 0.0

    return {
        "demographic_parity": demographic_parity,
        "disparate_impact": disparate_impact,
        "equal_opportunity": eq_opp,
    }
