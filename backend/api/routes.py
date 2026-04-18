"""
FairLens API routes
-------------------
/upload          – accept a CSV, store the DataFrame in memory, return metadata
/upload-model    – accept a .pkl or .joblib model file, store in memory, return model_id
/analyze         – run Vishaal's fairness metrics on a previously uploaded file
/explain         – compute SHAP feature importances for an uploaded CSV + model (top-10)
/infer-fairness  – run model.predict() on an uploaded CSV then compute fairness metrics
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
from pydantic import BaseModel, Field
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

from ml.analyzer import analyze

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared in-memory store  (file_id -> DataFrame)
# Populated by /upload, consumed by /analyze, /explain, /infer-fairness
# ---------------------------------------------------------------------------
uploaded_files: dict[str, pd.DataFrame] = {}

# ---------------------------------------------------------------------------
# Shared in-memory model store  (model_id -> trained model object)
# Populated by /upload-model, consumed by /explain, /infer-fairness
# ---------------------------------------------------------------------------
uploaded_models: dict[str, object] = {}


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
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}")

    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df          # ← store for /analyze, /explain, /infer-fairness

    return {
        "file_id":   file_id,
        "columns":   df.columns.tolist(),
        "preview":   df.head(5).to_dict(orient="records"),
        "row_count": len(df),
    }


# ---------------------------------------------------------------------------
# Pydantic model for /upload-model
# ---------------------------------------------------------------------------
class ModelUploadResponse(BaseModel):
    model_id: str
    status:   Literal["uploaded"]
    type:     str   # model class name — retained for debugging


# ---------------------------------------------------------------------------
# POST /upload-model
# ---------------------------------------------------------------------------
@router.post("/upload-model", tags=["models"], response_model=ModelUploadResponse)
async def upload_model(file: UploadFile = File(...)):
    """
    Accept a serialized model (.pkl or .joblib) and store it in memory.

    Response shape:
    {
        "model_id": "a1b2c3d4",
        "status":   "uploaded",
        "type":     "<class 'sklearn.linear_model._logistic.LogisticRegression'>"
    }
    """
    if not (file.filename.endswith(".pkl") or file.filename.endswith(".joblib")):
        raise HTTPException(
            status_code=400,
            detail="Only .pkl or .joblib model files are accepted.",
        )

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
    try:
        model = joblib.load(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not deserialise model: {exc}",
        )

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
    file_id:       str = Field(..., min_length=1, description="Uploaded CSV file ID")
    protected_col: str = Field(..., min_length=1, description="Protected attribute column name")
    label_col:     str = Field(..., min_length=1, description="Target label column name")
    predicted_col: str = Field(..., min_length=1, description="Model prediction column name")


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
    try:
        results = analyze(
            df,
            request.protected_col,
            request.label_col,
            request.predicted_col,
        )
    except Exception as exc:
        logger.exception(f"analyze() failed in /analyze for file_id {request.file_id}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during analysis: {exc}")

    return {
        "metrics":       results,
        "protected_col": request.protected_col,
        "status":        "complete",
    }


# ---------------------------------------------------------------------------
# Pydantic models for /explain
# ---------------------------------------------------------------------------
class ExplainRequest(BaseModel):
    file_id:       str = Field(..., min_length=1)
    model_id:      str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)
    # NOTE: predicted_col intentionally omitted — SHAP calls model.predict()
    # internally, so a pre-existing prediction column is not needed here.


class ExplainResponse(BaseModel):
    shap_values: dict[str, float]   # top-10 features by mean |SHAP|
    status:      Literal["complete", "error"]


# ---------------------------------------------------------------------------
# Shared feature-matrix builder (used by /explain and /infer-fairness)
# ---------------------------------------------------------------------------
def _build_feature_matrix(
    df: pd.DataFrame,
    label_col: str,
    protected_col: str,
    model: object,
) -> pd.DataFrame:
    """
    Drop target / sensitive columns, keep only numeric columns, and align to
    the model's expected feature order when possible.

    Raises ValueError with a descriptive message on column mismatch so that
    callers can surface a clean 422 to the client.
    """
    drop_cols = {label_col, protected_col} & set(df.columns)
    X = df.drop(columns=list(drop_cols)).select_dtypes(include="number")

    if hasattr(model, "feature_names_in_"):
        # sklearn estimators fitted on a DataFrame expose this attribute
        expected = list(model.feature_names_in_)
        missing = set(expected) - set(X.columns)
        if missing:
            raise ValueError(
                f"CSV is missing model features: {sorted(missing)}. "
                f"Expected features: {expected}"
            )
        X = X[expected]   # reorder to match training column order
    else:
        # Non-sklearn models (XGBoost, LightGBM, numpy-fitted sklearn, etc.)
        # Fall back to positional column order and warn — caller is responsible
        # for ensuring the CSV columns match the training order.
        logger.warning(
            "Model has no feature_names_in_ attribute; using positional column "
            "order. Ensure the CSV feature columns match the training order. "
            "Columns used: %s",
            list(X.columns),
        )

    return X


# ---------------------------------------------------------------------------
# CPU-bound SHAP computation helper — must run inside a thread
# ---------------------------------------------------------------------------
_SHAP_SAMPLE_CAP = 1_000   # max rows sampled for SHAP background


def _compute_shap(model: object, background: pd.DataFrame) -> np.ndarray:
    """
    Synchronous (blocking) SHAP computation.
    Always call this via run_in_executor — never directly from an async route.
    """
    explainer = shap.Explainer(model, background)
    shap_obj = explainer(background)
    values = shap_obj.values

    # shap_obj.values is 3-D for multi-class models: (samples, features, classes)
    # Use the class-1 (positive) slice for binary classification.
    if values.ndim == 3:
        values = values[:, :, 1]

    return values


# ---------------------------------------------------------------------------
# POST /explain
# ---------------------------------------------------------------------------
@router.post("/explain", tags=["explainability"], response_model=ExplainResponse)
async def explain_file(request: ExplainRequest):
    """
    Compute SHAP feature importances for a previously uploaded CSV + model.

    Returns the top-10 features by mean absolute SHAP value.
    SHAP computation runs in a thread pool to avoid blocking the event loop.

    Response shape:
    {
        "shap_values": {"age": 0.42, "income": 0.31, ...},
        "status": "complete"
    }
    """
    # --- 1. Look up data and model ---
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail="File not found. Upload a CSV first via POST /upload.",
        )
    if request.model_id not in uploaded_models:
        raise HTTPException(
            status_code=404,
            detail="Model not found. Upload a model first via POST /upload-model.",
        )

    df    = uploaded_files[request.file_id]
    model = uploaded_models[request.model_id]

    # --- 2. Validate that referenced columns exist ---
    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
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
        # --- 3. Build feature matrix with hasattr guard ---
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)

        # --- 4. Sample down to cap to prevent OOM on large CSVs ---
        n_rows = len(X)
        background = shap.sample(X, min(_SHAP_SAMPLE_CAP, n_rows))
        if n_rows > _SHAP_SAMPLE_CAP:
            logger.info(
                "SHAP background sampled: %d rows used out of %d total.",
                _SHAP_SAMPLE_CAP, n_rows,
            )

        # --- 5. Run SHAP in a thread (CPU-bound; must not block event loop) ---
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            shap_matrix = await loop.run_in_executor(
                pool, _compute_shap, model, background
            )

        # --- 6. Mean |SHAP| per feature → sort → top-10 ---
        mean_abs = np.abs(shap_matrix).mean(axis=0)
        feature_names = list(background.columns)
        ranked = sorted(
            zip(feature_names, mean_abs.tolist()),
            key=lambda pair: pair[1],
            reverse=True,
        )
        top10 = {name: round(float(val), 6) for name, val in ranked[:10]}

    except HTTPException:
        raise   # re-raise 404/422 from column validation
    except ValueError as exc:
        # _build_feature_matrix raises ValueError for column mismatches
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("SHAP computation failed")
        raise HTTPException(status_code=500, detail=f"SHAP computation error: {exc}")

    return ExplainResponse(shap_values=top10, status="complete")


# ---------------------------------------------------------------------------
# Pydantic models for /infer-fairness
# ---------------------------------------------------------------------------
class InferFairnessRequest(BaseModel):
    file_id:       str = Field(..., min_length=1)
    model_id:      str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)


class InferFairnessResponse(BaseModel):
    metrics:       dict[str, float]
    protected_col: str
    status:        Literal["complete", "error"]


_INFER_ROW_CAP = 100_000   # max rows processed for inference + fairness check


# ---------------------------------------------------------------------------
# POST /infer-fairness
# ---------------------------------------------------------------------------
@router.post(
    "/infer-fairness",
    tags=["fairness"],
    response_model=InferFairnessResponse,
)
def infer_and_check_fairness(request: InferFairnessRequest):
    """
    Load an uploaded model, run predict() on an uploaded CSV, then compute
    fairness metrics via Vishaal's analyze().

    Response shape:
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
    # --- 1. Look up data and model ---
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail="File not found. Upload a CSV first via POST /upload.",
        )
    if request.model_id not in uploaded_models:
        raise HTTPException(
            status_code=404,
            detail="Model not found. Upload a model first via POST /upload-model.",
        )

    df    = uploaded_files[request.file_id]
    model = uploaded_models[request.model_id]

    # --- 2. Validate required columns ---
    for col_name, col_val in {
        "protected_col": request.protected_col,
        "label_col":     request.label_col,
    }.items():
        if col_val not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Column '{col_val}' (passed as {col_name}) not found. "
                    f"Available columns: {df.columns.tolist()}"
                ),
            )

    # --- 3. Build feature matrix ---
    try:
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # --- 4. Enforce row cap (warn but don't error) ---
    if len(X) > _INFER_ROW_CAP:
        X = X.iloc[:_INFER_ROW_CAP]
        logger.warning(
            "Dataset truncated to %d rows for inference (original: %d rows).",
            _INFER_ROW_CAP, len(df),
        )

    # --- 5. Run model.predict() with clear shape-mismatch error ---
    try:
        predictions = model.predict(X)
    except (ValueError, IndexError) as exc:
        n_csv = X.shape[1]
        n_model = getattr(model, "n_features_in_", "?")
        expected_names = (
            list(model.feature_names_in_)
            if hasattr(model, "feature_names_in_")
            else "unavailable (model has no feature_names_in_)"
        )
        raise HTTPException(
            status_code=422,
            detail=(
                f"Shape mismatch: model expects {n_model} features, "
                f"CSV provides {n_csv}. "
                f"Expected feature names: {expected_names}. "
                f"Original error: {exc}"
            ),
        )

    # --- 6. Attach predictions with collision-safe column name ---
    df_copy = df.iloc[: len(X)].copy()   # align rows to any truncation
    pred_col = "_fairlens_pred_"
    if pred_col in df_copy.columns:
        pred_col = f"_fairlens_pred_{uuid.uuid4().hex[:4]}_"
    df_copy[pred_col] = predictions

    # --- 7. Compute fairness metrics via Vishaal's analyzer ---
    try:
        results = analyze(df_copy, request.protected_col, request.label_col, pred_col)
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
    file_id:       str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)
    predicted_col: str = Field(..., min_length=1)


class MitigateResponse(BaseModel):
    before: dict[str, float]
    after:  dict[str, float]
    status: Literal["complete", "error"]


@router.post(
    "/mitigate",
    tags=["fairness"],
    response_model=MitigateResponse,
)
def mitigate_file(request: MitigateRequest):
    """
    Apply AIF360 Reweighing on an uploaded dataset to mitigate bias.
    Computes fairness metrics before and after mitigation.
    """
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail="File not found. Upload a CSV first via POST /upload.",
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
        # Compute BEFORE metrics
        before_metrics = analyze(df, request.protected_col, request.label_col, request.predicted_col)

        # Identify privileged / unprivileged groups automatically
        groups = df[request.protected_col].unique()
        pos_rates = {}
        for group in groups:
            group_df = df[df[request.protected_col] == group]
            if len(group_df) > 0:
                pos_rates[group] = (group_df[request.label_col] == 1).mean()
            else:
                pos_rates[group] = 0.0

        privileged_group_val = max(pos_rates, key=pos_rates.get) if pos_rates else None
        
        if len(groups) > 1 and privileged_group_val is not None:
            unprivileged_groups = [{request.protected_col: g} for g in groups if g != privileged_group_val]
            privileged_groups = [{request.protected_col: privileged_group_val}]

            df_copy = df.copy()
            # Convert string categories to categorical codes for AIF360
            for col in df_copy.select_dtypes(include=['object', 'category']).columns:
                df_copy[col] = df_copy[col].astype('category').cat.codes
        
            dataset = BinaryLabelDataset(
                df=df_copy,
                label_names=[request.label_col],
                protected_attribute_names=[request.protected_col],
                favorable_label=1,
                unfavorable_label=0
            )

            rw = Reweighing(unprivileged_groups=unprivileged_groups, privileged_groups=privileged_groups)
            dataset_transf = rw.fit_transform(dataset)

            # Resample dataset using Reweighing weights to "apply" the weights to raw dataframe that analyze can use
            weights = dataset_transf.instance_weights
            weights = np.nan_to_num(weights, nan=0.0)
            if weights.sum() == 0:
                weights = np.ones(len(weights))
            df_reweighed = df.sample(n=len(df), weights=weights, replace=True, random_state=42)

        else:
            df_reweighed = df.copy()

        # Compute AFTER metrics
        after_metrics = analyze(df_reweighed, request.protected_col, request.label_col, request.predicted_col)

    except Exception as exc:
        logger.exception("analyze() or Reweighing failed in /mitigate")
        raise HTTPException(status_code=500, detail=f"Unexpected error computing metrics: {exc}")

    return MitigateResponse(
        before=before_metrics,
        after=after_metrics,
        status="complete"
    )

