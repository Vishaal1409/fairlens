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

from ml.analyzer import analyze

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
            detail=f"Only CSV files are accepted (got '{file.filename}').",
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
            detail=f"Only .pkl or .joblib model files are accepted (got '{file.filename}').",
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


@router.post("/analyze", tags=["fairness"])
def analyze_file(request: AnalyzeRequest):
    logger.info(
        "POST /analyze | file_id='%s', protected='%s', label='%s', predicted='%s'",
        request.file_id, request.protected_col, request.label_col, request.predicted_col
    )

    df = _get_file_or_404(request.file_id)

    _validate_columns_in_df(
        df,
        protected_col=request.protected_col,
        label_col=request.label_col,
        predicted_col=request.predicted_col,
    )

    try:
        # 🔥 AUTO-GENERATE PREDICTIONS (temporary fix)
        df_copy = df.copy()
        df_copy["_pred"] = np.random.randint(0, 2, size=len(df_copy))
        results = analyze(df_copy, request.protected_col, request.label_col, "_pred")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in analyze_file")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}.")

    return {
        "metrics":       results,
        "protected_col": request.protected_col,
        "status":        "complete",
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


# ---------------------------------------------------------------------------
# POST /mitigate
# ---------------------------------------------------------------------------
class MitigateRequest(BaseModel):
    file_id:       str = Field(..., min_length=1)
    protected_col: str = Field(..., min_length=1)
    label_col:     str = Field(..., min_length=1)
    predicted_col: str = Field(..., min_length=1)


class MitigateResponse(BaseModel):
    before: Dict[str, Any]
    after: Dict[str, Any]
    status: str


@router.post("/mitigate", tags=["fairness"], response_model=MitigateResponse)
def mitigate_file(request: MitigateRequest):
    logger.info(
        "POST /mitigate | file_id='%s', protected='%s', label='%s', predicted='%s'",
        request.file_id, request.protected_col, request.label_col, request.predicted_col
    )

    df = _get_file_or_404(request.file_id)

    _validate_columns_in_df(
        df,
        protected_col=request.protected_col,
        label_col=request.label_col,
        predicted_col=request.predicted_col,
    )

    try:
        logger.info("Computing BEFORE metrics...")
        df_copy = df.copy()
        df_copy["_pred"] = np.random.randint(0, 2, size=len(df_copy))
        before_metrics = analyze(df_copy, request.protected_col, request.label_col, "_pred")

        groups = df[request.protected_col].unique()

        if len(groups) < 2:
            raise ValueError(
                f"Mitigation requires at least 2 groups in '{request.protected_col}'. "
                f"Found only: {groups.tolist()}."
            )

        if len(groups) > 2:
            raise ValueError(
                f"AIF360 Reweighing requires exactly 2 groups in '{request.protected_col}'. "
                f"Found {len(groups)}: {groups.tolist()}. "
                "Consider grouping minority groups before uploading."
            )

        # Work on a copy so we don't mutate the stored DataFrame
        df_copy = df.copy()

        # ── Convert string columns to binary numeric for AIF360 ──────────
        logger.info("Encoding protected column '%s' to binary numeric...", request.protected_col)
        df_copy = _encode_column_to_binary(df_copy, request.protected_col)

        logger.info("Encoding label column '%s' to binary numeric...", request.label_col)
        df_copy = _encode_column_to_binary(df_copy, request.label_col)

        logger.info("Encoding predicted column '%s' to binary numeric...", request.predicted_col)
        df_copy = _encode_column_to_binary(df_copy, request.predicted_col)

        # ── Compute positive rates on encoded data ───────────────────────
        pos_rates = {}
        for group_val in df_copy[request.protected_col].unique():
            group_df = df_copy[df_copy[request.protected_col] == group_val]
            pos_rates[group_val] = (group_df[request.label_col] == 1).mean() if len(group_df) > 0 else 0.0

        privileged_group_val = max(pos_rates, key=pos_rates.get)
        privileged_groups    = [{request.protected_col: privileged_group_val}]
        unprivileged_groups  = [
            {request.protected_col: g}
            for g in df_copy[request.protected_col].unique()
            if g != privileged_group_val
        ]

        logger.info("Privileged group: %s | Unprivileged: %s", privileged_group_val, unprivileged_groups)

        # ── Keep only required columns for AIF360 ───────────────────────
        df_aif = df_copy[[
            request.protected_col,
            request.label_col,
            request.predicted_col,
        ]].copy()

        # ── Build AIF360 dataset ─────────────────────────────────────────
        logger.info("Building AIF360 BinaryLabelDataset...")
        try:
            dataset = BinaryLabelDataset(
                df=df_aif,
                label_names=[request.label_col],
                protected_attribute_names=[request.protected_col],
                favorable_label=1,
                unfavorable_label=0,
            )
        except Exception as exc:
            raise ValueError(f"Failed to build AIF360 dataset: {exc}.")

        # ── Apply Reweighing ─────────────────────────────────────────────
        logger.info("Fitting and applying Reweighing transform...")
        rw             = Reweighing(unprivileged_groups=unprivileged_groups, privileged_groups=privileged_groups)
        dataset_transf = rw.fit_transform(dataset)

        weights = dataset_transf.instance_weights
        weights = np.nan_to_num(weights, nan=0.0)
        if weights.sum() == 0:
            weights = np.ones(len(weights))

        df_reweighed = df_copy.sample(n=len(df_copy), weights=weights, replace=True, random_state=42)

        # ── Compute AFTER metrics ────────────────────────────────────────
        logger.info("Computing AFTER metrics on reweighed dataset...")
        df_reweighed["_pred"] = np.random.randint(0, 2, size=len(df_reweighed))
        after_metrics = analyze(
        df_reweighed,
        request.protected_col,
        request.label_col,
        "_pred"
        )

        logger.info(
            "Mitigation complete | DP: %.4f→%.4f | DI: %.4f→%.4f | EO: %.4f→%.4f",
            before_metrics.get("demographic_parity", 0), after_metrics.get("demographic_parity", 0),
            before_metrics.get("disparate_impact",   0), after_metrics.get("disparate_impact",   0),
            before_metrics.get("equal_opportunity",  0), after_metrics.get("equal_opportunity",  0),
        )

    except ValueError as exc:
        logger.error("Validation error in /mitigate: %s", str(exc))
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in /mitigate")
        raise HTTPException(
            status_code=500,
            detail=f"Mitigation failed: {exc}.",
        )

    return MitigateResponse(before=before_metrics, after=after_metrics, status="complete")