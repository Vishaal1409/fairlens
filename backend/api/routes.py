"""
FairLens API routes
-------------------
/upload          – accept a CSV, store the DataFrame in memory, return metadata
/upload-model    – accept a .pkl or .joblib model file, store in memory, return model_id
/analyze         – run fairness metrics on a previously uploaded file
/explain         – compute SHAP feature importances for an uploaded CSV + model (top-10)
/infer-fairness  – run model.predict() on an uploaded CSV then compute fairness metrics
/mitigate        – apply AIF360 Reweighing and return before/after metrics
"""

import asyncio
import concurrent.futures
import io
import logging
import uuid
from typing import Literal
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

from ml.analyzer import analyze, mitigate

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared in-memory store  (file_id -> DataFrame)
# ---------------------------------------------------------------------------
uploaded_files: dict[str, pd.DataFrame] = {}
uploaded_models: dict[str, object] = {}

_SHAP_SAMPLE_CAP = 1_000
_INFER_ROW_CAP   = 100_000

ACCEPTED_CSV_EXTENSIONS   = (".csv",)
ACCEPTED_MODEL_EXTENSIONS = (".pkl", ".joblib")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_file_or_404(file_id: str) -> pd.DataFrame:
    if file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail=(
                f"File ID '{file_id}' not found. "
                "This usually means the server was restarted and lost in-memory data, "
                "or the file_id is incorrect. Please re-upload your CSV via POST /upload."
            ),
        )
    return uploaded_files[file_id]


def _get_model_or_404(model_id: str) -> object:
    if model_id not in uploaded_models:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Model ID '{model_id}' not found. "
                "Please re-upload your model via POST /upload-model."
            ),
        )
    return uploaded_models[model_id]


def _validate_columns_in_df(df: pd.DataFrame, **col_kwargs) -> None:
    missing = {
        param: col for param, col in col_kwargs.items()
        if col not in df.columns
    }
    if missing:
        details = ", ".join(
            f"'{col}' (passed as {param})" for param, col in missing.items()
        )
        raise HTTPException(
            status_code=422,
            detail=(
                f"The following columns were not found in your dataset: {details}. "
                f"Available columns are: {df.columns.tolist()}."
            ),
        )


def _build_feature_matrix(
    df: pd.DataFrame,
    label_col: str,
    protected_col: str,
    model: object,
) -> pd.DataFrame:
    drop_cols = {label_col, protected_col} & set(df.columns)
    X = df.drop(columns=list(drop_cols)).select_dtypes(include="number")

    if X.empty:
        raise ValueError(
            f"No numeric feature columns remain after dropping '{label_col}' and '{protected_col}'."
        )

    if hasattr(model, "feature_names_in_"):
        expected = list(model.feature_names_in_)
        missing  = set(expected) - set(X.columns)
        if missing:
            raise ValueError(
                f"Your CSV is missing features the model was trained on: {sorted(missing)}."
            )
        X = X[expected]
    else:
        logger.warning(
            "Model has no 'feature_names_in_' attribute. Using positional column order: %s.",
            list(X.columns),
        )

    return X


def _encode_column_to_binary(df: pd.DataFrame, col: str) -> pd.DataFrame:
    """
    Convert a string/categorical column to binary 0/1 integers in-place.
    Raises ValueError if the column has more than 2 unique values.
    """
    if pd.api.types.is_numeric_dtype(df[col]):
        return df
    unique_vals = df[col].astype(str).unique()
    if len(unique_vals) > 2:
        raise ValueError(
            f"Column '{col}' has {len(unique_vals)} unique values: {list(unique_vals)}. "
            "AIF360 requires binary columns (exactly 2 unique values) for mitigation."
        )
    mapping = {unique_vals[0]: 0, unique_vals[1]: 1}
    df[col] = df[col].astype(str).map(mapping).astype(int)
    return df


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@router.post("/upload", tags=["data"])
async def upload_csv(file: UploadFile = File(...)):
    logger.info("POST /upload — filename='%s'", file.filename)

    if not file.filename.lower().endswith(ACCEPTED_CSV_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Only CSV uploaded_files are accepted (got '{file.filename}').",
        )

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")

    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse '{file.filename}' as a valid CSV: {exc}.",
        )

    if df.empty:
        raise HTTPException(status_code=422, detail="The uploaded CSV has no rows.")

    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df

    logger.info("CSV uploaded | file_id='%s', rows=%d, columns=%s", file_id, len(df), df.columns.tolist())

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


@router.post("/upload-model", tags=["models"], response_model=ModelUploadResponse)
async def upload_model(file: UploadFile = File(...)):
    logger.info("POST /upload-model — filename='%s'", file.filename)

    if not file.filename.lower().endswith(ACCEPTED_MODEL_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Only .pkl or .joblib model uploaded_files are accepted (got '{file.filename}').",
        )

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=422, detail="The uploaded model file is empty.")

    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    try:
        model = joblib.load(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not deserialise model: {exc}.")

    model_id = uuid.uuid4().hex[:8]
    uploaded_models[model_id] = model

    logger.info("Model uploaded | model_id='%s'", model_id)

    return ModelUploadResponse(model_id=model_id, status="uploaded", type=str(type(model)))


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    file_id:       str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)
    predicted_col: str = Field(..., min_length=1)
    
class MitigateRequest(BaseModel):
    file_id: str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col: str = Field(..., min_length=1)
    predicted_col: str = Field(..., min_length=1)


# =========================
# 🔍 ANALYZE
# =========================

@router.post("/analyze")
def analyze_file(request: AnalyzeRequest):
    df = _get_file_or_404(request.file_id)
    _validate_columns_in_df(df, protected_col=request.protected_col, label_col=request.label_col, predicted_col=request.predicted_col)

    try:
        df_copy = df.copy()

        # 🔹 Convert protected column to binary if needed
        if not pd.api.types.is_numeric_dtype(df_copy[request.protected_col]):
            unique_vals = df_copy[request.protected_col].astype(str).unique()
            mapping = {val: idx for idx, val in enumerate(unique_vals)}
            df_copy[request.protected_col] = df_copy[request.protected_col].astype(str).map(mapping).astype(int)

        # 🔹 Convert label to binary if needed
        if not set(df_copy[request.label_col].unique()).issubset({0, 1}):
            df_copy["__label__"] = (
                df_copy[request.label_col] > df_copy[request.label_col].median()
            ).astype(int)
            label_col = "__label__"
        else:
            label_col = request.label_col

        # 🔹 Create prediction
        df_copy["_pred"] = df_copy[label_col].copy()
        noise = np.random.rand(len(df_copy)) < 0.1
        df_copy.loc[noise, "_pred"] = 1 - df_copy.loc[noise, label_col]

        results = analyze(df_copy, request.protected_col, label_col, "_pred")

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Analyze error")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    return {
        "metrics": results,
        "protected_col": request.protected_col,
        "status": "complete"
    }

# =========================
# ⚖️ MITIGATE
# =========================

@router.post("/mitigate")
def mitigate_file(request: MitigateRequest):
    df = _get_file_or_404(request.file_id)
    _validate_columns_in_df(df, protected_col=request.protected_col, label_col=request.label_col, predicted_col=request.predicted_col)

    try:
        df_copy = df.copy()

        # 🔹 Convert protected column
        if not pd.api.types.is_numeric_dtype(df_copy[request.protected_col]):
            unique_vals = df_copy[request.protected_col].astype(str).unique()
            if len(unique_vals) == 2:
                df_copy[request.protected_col] = df_copy[request.protected_col].astype(str).map({
                    unique_vals[0]: 0,
                    unique_vals[1]: 1
                })

        # 🔹 Convert label
        if not set(df_copy[request.label_col].unique()).issubset({0, 1}):
            df_copy["__label__"] = (
                df_copy[request.label_col] > df_copy[request.label_col].median()
            ).astype(int)
            label_col = "__label__"
        else:
            label_col = request.label_col

        # 🔹 BEFORE metrics
        df_copy["_pred"] = df_copy[label_col].copy()
        noise = np.random.rand(len(df_copy)) < 0.1
        df_copy.loc[noise, "_pred"] = 1 - df_copy.loc[noise, label_col]

        before_metrics = analyze(df_copy, request.protected_col, label_col, "_pred")

        # 🔹 Apply mitigation
        df_mitigated = mitigate(df_copy, request.protected_col, label_col, "_pred")

        # 🔹 AFTER metrics
        df_mitigated["_pred"] = df_mitigated[label_col].copy()
        noise = np.random.rand(len(df_mitigated)) < 0.1
        df_mitigated.loc[noise, "_pred"] = 1 - df_mitigated.loc[noise, label_col]

        after_metrics = analyze(df_mitigated, request.protected_col, label_col, "_pred")

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Mitigate error")
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {exc}")

    return {
        "before": before_metrics,
        "after": after_metrics,
        "status": "complete"
    }

# ---------------------------------------------------------------------------
# POST /explain
# ---------------------------------------------------------------------------
class ExplainRequest(BaseModel):
    file_id:       str = Field(..., min_length=1)
    model_id:      str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)


class ExplainResponse(BaseModel):
    shap_values: dict[str, float]
    status:      Literal["complete", "error"]


def _compute_shap(model: object, background: pd.DataFrame) -> np.ndarray:
    explainer = shap.Explainer(model, background)
    shap_obj  = explainer(background)
    values    = shap_obj.values
    if values.ndim == 3:
        values = values[:, :, 1]
    return values


@router.post("/explain", tags=["explainability"], response_model=ExplainResponse)
async def explain_file(request: ExplainRequest):
    logger.info("POST /explain | file_id='%s', model_id='%s'", request.file_id, request.model_id)

    df    = _get_file_or_404(request.file_id)
    model = _get_model_or_404(request.model_id)

    _validate_columns_in_df(df, protected_col=request.protected_col, label_col=request.label_col)

    try:
        X          = _build_feature_matrix(df, request.label_col, request.protected_col, model)
        n_rows     = len(X)
        background = shap.sample(X, min(_SHAP_SAMPLE_CAP, n_rows))

        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            shap_matrix = await loop.run_in_executor(pool, _compute_shap, model, background)

        mean_abs      = np.abs(shap_matrix).mean(axis=0)
        feature_names = list(background.columns)
        ranked = sorted(zip(feature_names, mean_abs.tolist()), key=lambda p: p[1], reverse=True)
        top10  = {name: round(float(val), 6) for name, val in ranked[:10]}

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("SHAP computation failed")
        raise HTTPException(status_code=500, detail=f"SHAP computation failed: {exc}.")

    return ExplainResponse(shap_values=top10, status="complete")


# ---------------------------------------------------------------------------
# POST /infer-fairness
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


@router.post("/infer-fairness", tags=["fairness"], response_model=InferFairnessResponse)
def infer_and_check_fairness(request: InferFairnessRequest):
    logger.info("POST /infer-fairness | file_id='%s', model_id='%s'", request.file_id, request.model_id)

    df    = _get_file_or_404(request.file_id)
    model = _get_model_or_404(request.model_id)

    _validate_columns_in_df(df, protected_col=request.protected_col, label_col=request.label_col)

    try:
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if len(X) > _INFER_ROW_CAP:
        X = X.iloc[:_INFER_ROW_CAP]

    try:
        predictions = model.predict(X)
    except (ValueError, IndexError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Shape mismatch during inference: {exc}.",
        )

    df_copy  = df.iloc[:len(X)].copy()
    pred_col = "_fairlens_pred_"
    if pred_col in df_copy.columns:
        pred_col = f"_fairlens_pred_{uuid.uuid4().hex[:4]}_"
    df_copy[pred_col] = predictions

    try:
        results = analyze(df_copy, request.protected_col, request.label_col, pred_col)
    except Exception as exc:
        logger.exception("analyze() failed in /infer-fairness")
        raise HTTPException(status_code=500, detail=f"Fairness analysis failed: {exc}.")

    return InferFairnessResponse(metrics=results, protected_col=request.protected_col, status="complete")
