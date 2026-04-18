"""
FairLens API routes
-------------------
/upload          – accept a CSV, store the DataFrame in memory, return metadata
/upload-model    – accept a .pkl or .joblib model file, store in memory, return model_id
/analyze         – run fairness metrics on a previously uploaded file
/explain         – compute SHAP + LIME feature importances for an uploaded CSV + model
/infer-fairness  – run model.predict() on an uploaded CSV then compute fairness metrics
/mitigate        – apply AIF360 Reweighing and return before/after metrics
/export-code     – return ready-to-run Python mitigation code for one-click export
"""

import asyncio
import concurrent.futures
import io
import logging
import uuid
from typing import Literal

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

from ml.analyzer import analyze

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared in-memory stores
# ---------------------------------------------------------------------------
uploaded_files:  dict[str, pd.DataFrame] = {}   # file_id  -> DataFrame
uploaded_models: dict[str, object]       = {}   # model_id -> trained model


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@router.post(
    "/upload",
    tags=["data"],
    summary="Upload a CSV dataset",
    description=(
        "Upload a CSV file for fairness analysis. "
        "Returns a file_id to use in subsequent /analyze, /explain, /mitigate calls, "
        "along with column names, a 5-row preview, and total row count."
    ),
)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}")

    if len(df) == 0:
        raise HTTPException(status_code=422, detail="Uploaded CSV is empty.")

    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df

    return {
        "file_id":   file_id,
        "columns":   df.columns.tolist(),
        "preview":   df.head(5).to_dict(orient="records"),
        "row_count": len(df),
    }


# ---------------------------------------------------------------------------
# POST /upload-model
# ---------------------------------------------------------------------------
class ModelUploadResponse(BaseModel):
    model_id: str
    status:   Literal["uploaded"]
    type:     str


@router.post(
    "/upload-model",
    tags=["models"],
    response_model=ModelUploadResponse,
    summary="Upload a trained ML model",
    description=(
        "Upload a serialized sklearn model (.pkl or .joblib). "
        "Returns a model_id to use in /explain and /infer-fairness calls."
    ),
)
async def upload_model(file: UploadFile = File(...)):
    if not (file.filename.endswith(".pkl") or file.filename.endswith(".joblib")):
        raise HTTPException(
            status_code=400,
            detail="Only .pkl or .joblib model files are accepted.",
        )

    contents = await file.read()
    try:
        model = joblib.load(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not deserialise model: {exc}")

    model_id = uuid.uuid4().hex[:8]
    uploaded_models[model_id] = model

    return ModelUploadResponse(
        model_id=model_id,
        status="uploaded",
        type=str(type(model)),
    )


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    file_id:       str
    protected_col: str
    label_col:     str
    predicted_col: str


@router.post(
    "/analyze",
    tags=["fairness"],
    summary="Run fairness metrics on an uploaded dataset",
    description=(
        "Runs 5 fairness metrics (Demographic Parity, Disparate Impact, Equal Opportunity, "
        "Calibration, Predictive Parity) on a previously uploaded CSV. "
        "Also returns SHAP + LIME explainability values and AIF360 mitigation results. "
        "Requires file_id from /upload and column names for protected attribute, label, and predictions."
    ),
)
def analyze_file(request: AnalyzeRequest):
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail="File not found. Upload it first via POST /upload.",
        )

    df = uploaded_files[request.file_id]

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

    try:
        results = analyze(
            df,
            request.protected_col,
            request.label_col,
            request.predicted_col,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return {
        "metrics":       results,
        "protected_col": request.protected_col,
        "status":        "complete",
    }


# ---------------------------------------------------------------------------
# POST /explain
# ---------------------------------------------------------------------------
class ExplainRequest(BaseModel):
    file_id:       str
    model_id:      str
    protected_col: str
    label_col:     str


class ExplainResponse(BaseModel):
    shap_values: dict[str, float]
    status:      Literal["complete", "error"]


def _build_feature_matrix(
    df: pd.DataFrame,
    label_col: str,
    protected_col: str,
    model: object,
) -> pd.DataFrame:
    drop_cols = {label_col, protected_col} & set(df.columns)
    X = df.drop(columns=list(drop_cols)).select_dtypes(include="number")

    if hasattr(model, "feature_names_in_"):
        expected = list(model.feature_names_in_)
        missing  = set(expected) - set(X.columns)
        if missing:
            raise ValueError(
                f"CSV is missing model features: {sorted(missing)}. "
                f"Expected features: {expected}"
            )
        X = X[expected]
    else:
        logger.warning(
            "Model has no feature_names_in_ attribute; using positional column order. "
            "Columns used: %s", list(X.columns),
        )

    return X


_SHAP_SAMPLE_CAP = 1_000


def _compute_shap(model: object, background: pd.DataFrame) -> np.ndarray:
    explainer = shap.Explainer(model, background)
    shap_obj  = explainer(background)
    values    = shap_obj.values
    if values.ndim == 3:
        values = values[:, :, 1]
    return values


@router.post(
    "/explain",
    tags=["explainability"],
    response_model=ExplainResponse,
    summary="Compute SHAP feature importances for a model + dataset",
    description=(
        "Runs SHAP (SHapley Additive exPlanations) on an uploaded CSV + model. "
        "Returns the top-10 features by mean absolute SHAP value. "
        "SHAP runs in a background thread to avoid blocking. "
        "Requires both file_id (from /upload) and model_id (from /upload-model)."
    ),
)
async def explain_file(request: ExplainRequest):
    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found. Upload a CSV first via POST /upload.")
    if request.model_id not in uploaded_models:
        raise HTTPException(status_code=404, detail="Model not found. Upload a model first via POST /upload-model.")

    df    = uploaded_files[request.file_id]
    model = uploaded_models[request.model_id]

    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
    }.items():
        if col_val not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=f"Column '{col_val}' (passed as {col_name}) not found. Available: {df.columns.tolist()}",
            )

    try:
        X          = _build_feature_matrix(df, request.label_col, request.protected_col, model)
        n_rows     = len(X)
        background = shap.sample(X, min(_SHAP_SAMPLE_CAP, n_rows))

        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            shap_matrix = await loop.run_in_executor(pool, _compute_shap, model, background)

        mean_abs     = np.abs(shap_matrix).mean(axis=0)
        feature_names = list(background.columns)
        ranked       = sorted(zip(feature_names, mean_abs.tolist()), key=lambda p: p[1], reverse=True)
        top10        = {name: round(float(val), 6) for name, val in ranked[:10]}

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("SHAP computation failed")
        raise HTTPException(status_code=500, detail=f"SHAP computation error: {exc}")

    return ExplainResponse(shap_values=top10, status="complete")


# ---------------------------------------------------------------------------
# POST /infer-fairness
# ---------------------------------------------------------------------------
class InferFairnessRequest(BaseModel):
    file_id:       str
    model_id:      str
    protected_col: str
    label_col:     str


class InferFairnessResponse(BaseModel):
    metrics:       dict
    protected_col: str
    status:        Literal["complete", "error"]


_INFER_ROW_CAP = 100_000


@router.post(
    "/infer-fairness",
    tags=["fairness"],
    response_model=InferFairnessResponse,
    summary="Run model predictions then compute fairness metrics",
    description=(
        "Loads an uploaded model and runs predict() on an uploaded CSV, "
        "then computes fairness metrics via the FairLens analyzer. "
        "Useful when you don't have a pre-existing predictions column. "
        "Capped at 100,000 rows — larger datasets are silently truncated."
    ),
)
def infer_and_check_fairness(request: InferFairnessRequest):
    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found. Upload a CSV first via POST /upload.")
    if request.model_id not in uploaded_models:
        raise HTTPException(status_code=404, detail="Model not found. Upload a model first via POST /upload-model.")

    df    = uploaded_files[request.file_id]
    model = uploaded_models[request.model_id]

    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
    }.items():
        if col_val not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=f"Column '{col_val}' (passed as {col_name}) not found. Available: {df.columns.tolist()}",
            )

    try:
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if len(X) > _INFER_ROW_CAP:
        X = X.iloc[:_INFER_ROW_CAP]
        logger.warning("Dataset truncated to %d rows for inference.", _INFER_ROW_CAP)

    try:
        predictions = model.predict(X)
    except (ValueError, IndexError) as exc:
        n_csv   = X.shape[1]
        n_model = getattr(model, "n_features_in_", "?")
        raise HTTPException(
            status_code=422,
            detail=(
                f"Shape mismatch: model expects {n_model} features, CSV provides {n_csv}. "
                f"Original error: {exc}"
            ),
        )

    df_copy  = df.iloc[: len(X)].copy()
    pred_col = "_fairlens_pred_"
    if pred_col in df_copy.columns:
        pred_col = f"_fairlens_pred_{uuid.uuid4().hex[:4]}_"
    df_copy[pred_col] = predictions

    try:
        results = analyze(df_copy, request.protected_col, request.label_col, pred_col)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("analyze() failed in /infer-fairness")
        raise HTTPException(status_code=500, detail=f"Fairness computation error: {exc}")

    return InferFairnessResponse(
        metrics=results,
        protected_col=request.protected_col,
        status="complete",
    )


# ---------------------------------------------------------------------------
# POST /mitigate
# ---------------------------------------------------------------------------
class MitigateRequest(BaseModel):
    file_id:       str
    protected_col: str
    label_col:     str
    predicted_col: str


class MitigateResponse(BaseModel):
    before: dict
    after:  dict
    status: Literal["complete", "error"]


@router.post(
    "/mitigate",
    tags=["fairness"],
    response_model=MitigateResponse,
    summary="Apply bias mitigation and return before/after metrics",
    description=(
        "Applies AIF360 Reweighing to the uploaded dataset to reduce bias. "
        "Returns fairness metrics both before and after mitigation so you can "
        "see the improvement. Automatically detects privileged and unprivileged groups."
    ),
)
def mitigate_file(request: MitigateRequest):
    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found. Upload a CSV first via POST /upload.")

    df = uploaded_files[request.file_id]

    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
        "predicted_col": request.predicted_col,
    }.items():
        if col_val not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=f"Column '{col_val}' (passed as {col_name}) not found. Available: {df.columns.tolist()}",
            )

    try:
        before_metrics = analyze(df, request.protected_col, request.label_col, request.predicted_col)

        groups   = df[request.protected_col].unique()
        pos_rates = {}
        for group in groups:
            group_df       = df[df[request.protected_col] == group]
            pos_rates[group] = (group_df[request.label_col] == 1).mean() if len(group_df) else 0.0

        privileged_group_val = max(pos_rates, key=pos_rates.get) if pos_rates else None

        if len(groups) > 1 and privileged_group_val is not None:
            unprivileged_groups = [{request.protected_col: g} for g in groups if g != privileged_group_val]
            privileged_groups   = [{request.protected_col: privileged_group_val}]

            df_copy = df.copy()
            for col in df_copy.select_dtypes(include=["object", "category"]).columns:
                df_copy[col] = df_copy[col].astype("category").cat.codes

            dataset = BinaryLabelDataset(
                df=df_copy,
                label_names=[request.label_col],
                protected_attribute_names=[request.protected_col],
                favorable_label=1,
                unfavorable_label=0,
            )

            rw              = Reweighing(unprivileged_groups=unprivileged_groups, privileged_groups=privileged_groups)
            dataset_transf  = rw.fit_transform(dataset)
            weights         = dataset_transf.instance_weights
            weights         = np.nan_to_num(weights, nan=0.0)
            if weights.sum() == 0:
                weights = np.ones(len(weights))

            df_reweighed = df.sample(n=len(df), weights=weights, replace=True, random_state=42)
        else:
            df_reweighed = df.copy()

        after_metrics = analyze(df_reweighed, request.protected_col, request.label_col, request.predicted_col)

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Reweighing failed in /mitigate")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")

    return MitigateResponse(before=before_metrics, after=after_metrics, status="complete")


# ---------------------------------------------------------------------------
# POST /export-code
# ---------------------------------------------------------------------------
class ExportCodeRequest(BaseModel):
    protected_col: str
    label_col:     str
    predicted_col: str
    strategy:      Literal["reweighing", "disparate_impact_remover"] = "reweighing"


@router.post(
    "/export-code",
    tags=["export"],
    response_class=PlainTextResponse,
    summary="Export ready-to-run Python mitigation code",
    description=(
        "Returns a complete, self-contained Python script that applies the chosen "
        "bias mitigation strategy (Reweighing or Disparate Impact Remover) to your dataset. "
        "Copy and run it locally — no FairLens server needed. "
        "Strategy options: 'reweighing' (default) or 'disparate_impact_remover'."
    ),
)
def export_mitigation_code(request: ExportCodeRequest):
    protected = request.protected_col
    label     = request.label_col
    predicted = request.predicted_col
    strategy  = request.strategy

    if strategy == "reweighing":
        code = f'''"""
FairLens — Auto-generated Bias Mitigation Script
Strategy : Reweighing (AIF360)
Generated: via POST /export-code

Instructions:
  1. pip install aif360 pandas scikit-learn
  2. Replace 'your_dataset.csv' with your actual file path
  3. Run: python fairlens_mitigation.py
"""

import pandas as pd
import numpy as np
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

# ── Load your dataset ────────────────────────────────────────────
df = pd.read_csv("your_dataset.csv")

PROTECTED_COL = "{protected}"
LABEL_COL     = "{label}"
PREDICTED_COL = "{predicted}"

# ── Encode string columns to numeric if needed ───────────────────
for col in df.select_dtypes(include=["object", "category"]).columns:
    df[col] = df[col].astype("category").cat.codes

# ── Auto-detect privileged group ─────────────────────────────────
groups    = df[PROTECTED_COL].unique()
pos_rates = {{
    g: (df[df[PROTECTED_COL] == g][LABEL_COL] == 1).mean()
    for g in groups
}}
privileged_val      = max(pos_rates, key=pos_rates.get)
privileged_groups   = [{{PROTECTED_COL: privileged_val}}]
unprivileged_groups = [{{PROTECTED_COL: g}} for g in groups if g != privileged_val]

print(f"Privileged group   : {{privileged_val}}")
print(f"Unprivileged groups: {{[g[PROTECTED_COL] for g in unprivileged_groups]}}")

# ── Build AIF360 dataset ─────────────────────────────────────────
dataset = BinaryLabelDataset(
    df=df,
    label_names=[LABEL_COL],
    protected_attribute_names=[PROTECTED_COL],
    favorable_label=1,
    unfavorable_label=0,
)

# ── Apply Reweighing ─────────────────────────────────────────────
rw             = Reweighing(unprivileged_groups=unprivileged_groups, privileged_groups=privileged_groups)
dataset_transf = rw.fit_transform(dataset)

weights = dataset_transf.instance_weights
weights = np.nan_to_num(weights, nan=0.0)
if weights.sum() == 0:
    weights = np.ones(len(weights))

# ── Resample dataset using learned weights ────────────────────────
df_reweighed = df.sample(n=len(df), weights=weights, replace=True, random_state=42)

# ── Save result ──────────────────────────────────────────────────
df_reweighed.to_csv("reweighed_dataset.csv", index=False)
print("\\nDone! Reweighed dataset saved to: reweighed_dataset.csv")
print(f"Original rows : {{len(df)}}")
print(f"Reweighed rows: {{len(df_reweighed)}}")
'''

    else:  # disparate_impact_remover
        code = f'''"""
FairLens — Auto-generated Bias Mitigation Script
Strategy : Disparate Impact Remover (AIF360)
Generated: via POST /export-code

Instructions:
  1. pip install aif360 pandas scikit-learn
  2. Replace 'your_dataset.csv' with your actual file path
  3. Run: python fairlens_mitigation.py
"""

import pandas as pd
import numpy as np
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import DisparateImpactRemover

# ── Load your dataset ────────────────────────────────────────────
df = pd.read_csv("your_dataset.csv")

PROTECTED_COL = "{protected}"
LABEL_COL     = "{label}"
REPAIR_LEVEL  = 0.8   # 0.0 = no repair, 1.0 = full repair

# ── Encode string columns to numeric if needed ───────────────────
for col in df.select_dtypes(include=["object", "category"]).columns:
    df[col] = df[col].astype("category").cat.codes

# ── Build AIF360 dataset ─────────────────────────────────────────
dataset = BinaryLabelDataset(
    df=df,
    label_names=[LABEL_COL],
    protected_attribute_names=[PROTECTED_COL],
    favorable_label=1,
    unfavorable_label=0,
)

# ── Apply Disparate Impact Remover ───────────────────────────────
dir_model   = DisparateImpactRemover(repair_level=REPAIR_LEVEL, sensitive_attribute=PROTECTED_COL)
dir_dataset = dir_model.fit_transform(dataset)

df_repaired, _ = dir_dataset.convert_to_dataframe()

# ── Save result ──────────────────────────────────────────────────
df_repaired.to_csv("repaired_dataset.csv", index=False)
print("\\nDone! Repaired dataset saved to: repaired_dataset.csv")
print(f"Repair level used: {{REPAIR_LEVEL}}")
print(f"Rows: {{len(df_repaired)}}")
'''

    return PlainTextResponse(content=code, media_type="text/plain")