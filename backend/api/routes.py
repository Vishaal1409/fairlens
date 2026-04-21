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
uploaded_models: dict[str, object] = {}

_SHAP_SAMPLE_CAP = 1_000
_INFER_ROW_CAP   = 100_000

ACCEPTED_CSV_EXTENSIONS   = (".csv",)
ACCEPTED_MODEL_EXTENSIONS = (".pkl", ".joblib")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_file_or_404(file_id: str) -> pd.DataFrame:
    """
    Fetch a previously uploaded DataFrame by file_id.
    Raises a clear 404 if not found, with a hint about why it might be missing.
    """
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
    """
    Fetch a previously uploaded model by model_id.
    Raises a clear 404 if not found.
    """
    if model_id not in uploaded_models:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Model ID '{model_id}' not found. "
                "This usually means the server was restarted and lost in-memory data, "
                "or the model_id is incorrect. Please re-upload your model via POST /upload-model."
            ),
        )
    return uploaded_models[model_id]


def _validate_columns_in_df(df: pd.DataFrame, **col_kwargs) -> None:
    """
    Validate that named columns exist in the DataFrame.
    col_kwargs: param_name -> column_value  e.g. protected_col="gender"

    Raises HTTPException 422 with a clear message listing all missing columns
    and all available columns in the dataset.
    """
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
                f"Available columns are: {df.columns.tolist()}. "
                "Check for typos or case mismatches in your column names."
            ),
        )


def _build_feature_matrix(
    df: pd.DataFrame,
    label_col: str,
    protected_col: str,
    model: object,
) -> pd.DataFrame:
    """
    Drop target/sensitive columns, keep only numeric columns, and align to
    the model's expected feature order when possible.

    Raises ValueError with a descriptive message on column mismatch.
    """
    drop_cols = {label_col, protected_col} & set(df.columns)
    X = df.drop(columns=list(drop_cols)).select_dtypes(include="number")

    if X.empty:
        raise ValueError(
            f"No numeric feature columns remain after dropping '{label_col}' and '{protected_col}'. "
            "Ensure your CSV contains numeric feature columns beyond the label and protected attribute."
        )

    if hasattr(model, "feature_names_in_"):
        expected = list(model.feature_names_in_)
        missing  = set(expected) - set(X.columns)
        extra    = set(X.columns) - set(expected)
        if missing:
            raise ValueError(
                f"Your CSV is missing {len(missing)} feature(s) that the model was trained on: "
                f"{sorted(missing)}. "
                f"Expected features: {expected}. "
                f"Unexpected extra columns in CSV: {sorted(extra) if extra else 'none'}."
            )
        X = X[expected]
    else:
        logger.warning(
            "Model has no 'feature_names_in_' attribute. Using positional column order: %s. "
            "Ensure CSV feature columns are in the same order as training data.",
            list(X.columns),
        )

    return X


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@router.post("/upload", tags=["data"])
async def upload_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file and return metadata + a 5-row preview.
    """
    logger.info("POST /upload — filename='%s'", file.filename)

    if not file.filename.lower().endswith(ACCEPTED_CSV_EXTENSIONS):
        logger.warning("Rejected upload: unsupported file type '%s'", file.filename)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only CSV files are accepted (got '{file.filename}'). "
                "Please upload a file with a .csv extension."
            ),
        )

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is empty. Please upload a non-empty CSV file.",
        )

    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        logger.error("CSV parse error for '%s': %s", file.filename, str(exc))
        raise HTTPException(
            status_code=422,
            detail=(
                f"Could not parse '{file.filename}' as a valid CSV: {exc}. "
                "Ensure the file is UTF-8 encoded and uses commas as delimiters."
            ),
        )

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="The uploaded CSV has no rows. Please upload a file with at least one data row.",
        )

    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df

    logger.info(
        "CSV uploaded successfully | file_id='%s', rows=%d, columns=%s",
        file_id, len(df), df.columns.tolist()
    )

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
    type:     str


# ---------------------------------------------------------------------------
# POST /upload-model
# ---------------------------------------------------------------------------
@router.post("/upload-model", tags=["models"], response_model=ModelUploadResponse)
async def upload_model(file: UploadFile = File(...)):
    """
    Accept a serialized model (.pkl or .joblib) and store it in memory.
    """
    logger.info("POST /upload-model — filename='%s'", file.filename)

    if not file.filename.lower().endswith(ACCEPTED_MODEL_EXTENSIONS):
        logger.warning("Rejected model upload: unsupported extension '%s'", file.filename)
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only .pkl or .joblib model files are accepted (got '{file.filename}'). "
                "Serialize your model with joblib.dump() or pickle.dump() and re-upload."
            ),
        )

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(
            status_code=422,
            detail="The uploaded model file is empty. Please upload a valid serialized model.",
        )

    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    try:
        model = joblib.load(io.BytesIO(contents))
    except Exception as exc:
        logger.error("Model deserialisation failed for '%s': %s", file.filename, str(exc))
        raise HTTPException(
            status_code=422,
            detail=(
                f"Could not deserialise '{file.filename}': {exc}. "
                "Ensure the model was saved with joblib.dump() using a compatible scikit-learn version."
            ),
        )

    model_id   = uuid.uuid4().hex[:8]
    uploaded_models[model_id] = model

    model_type = str(type(model))
    logger.info(
        "Model uploaded successfully | model_id='%s', type=%s",
        model_id, model_type
    )

    return ModelUploadResponse(model_id=model_id, status="uploaded", type=model_type)


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
    Run fairness metrics on a previously uploaded CSV.
    """
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

    logger.info("Running analyzer on %d rows...", len(df))
    try:
        results = analyze(
            df,
            request.protected_col,
            request.label_col,
            request.predicted_col,
        )
    except ValueError as exc:
        logger.error("Validation error in analyzer: %s", str(exc))
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in analyze_file")
        raise HTTPException(
            status_code=500,
            detail=(
                f"An unexpected error occurred during fairness analysis: {exc}. "
                "Please check server logs for more details."
            ),
        )

    logger.info("Analysis complete for file_id='%s'", request.file_id)
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
    """Blocking SHAP computation — always call via run_in_executor."""
    explainer = shap.Explainer(model, background)
    shap_obj  = explainer(background)
    values    = shap_obj.values
    if values.ndim == 3:
        values = values[:, :, 1]
    return values


@router.post("/explain", tags=["explainability"], response_model=ExplainResponse)
async def explain_file(request: ExplainRequest):
    """
    Compute SHAP feature importances for a previously uploaded CSV + model.
    Returns top-10 features by mean absolute SHAP value.
    """
    logger.info(
        "POST /explain | file_id='%s', model_id='%s'",
        request.file_id, request.model_id
    )

    df    = _get_file_or_404(request.file_id)
    model = _get_model_or_404(request.model_id)

    _validate_columns_in_df(
        df,
        protected_col=request.protected_col,
        label_col=request.label_col,
    )

    try:
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)

        n_rows     = len(X)
        background = shap.sample(X, min(_SHAP_SAMPLE_CAP, n_rows))
        if n_rows > _SHAP_SAMPLE_CAP:
            logger.info(
                "SHAP background capped at %d rows (dataset has %d rows).",
                _SHAP_SAMPLE_CAP, n_rows
            )

        logger.info("Running SHAP in thread pool (non-blocking)...")
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            shap_matrix = await loop.run_in_executor(pool, _compute_shap, model, background)

        mean_abs      = np.abs(shap_matrix).mean(axis=0)
        feature_names = list(background.columns)
        ranked = sorted(zip(feature_names, mean_abs.tolist()), key=lambda p: p[1], reverse=True)
        top10  = {name: round(float(val), 6) for name, val in ranked[:10]}

        logger.info("SHAP complete. Top feature: '%s' = %.4f", *next(iter(top10.items())))

    except HTTPException:
        raise
    except ValueError as exc:
        logger.error("Feature matrix error in /explain: %s", str(exc))
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("SHAP computation failed in /explain")
        raise HTTPException(
            status_code=500,
            detail=(
                f"SHAP computation failed: {exc}. "
                "Common causes: model type not supported by shap.Explainer, "
                "feature mismatch between CSV and model, or insufficient memory."
            ),
        )

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
    """
    Run model.predict() on an uploaded CSV, then compute fairness metrics.
    """
    logger.info(
        "POST /infer-fairness | file_id='%s', model_id='%s', protected='%s', label='%s'",
        request.file_id, request.model_id, request.protected_col, request.label_col
    )

    df    = _get_file_or_404(request.file_id)
    model = _get_model_or_404(request.model_id)

    _validate_columns_in_df(
        df,
        protected_col=request.protected_col,
        label_col=request.label_col,
    )

    try:
        X = _build_feature_matrix(df, request.label_col, request.protected_col, model)
    except ValueError as exc:
        logger.error("Feature matrix build failed in /infer-fairness: %s", str(exc))
        raise HTTPException(status_code=422, detail=str(exc))

    if len(X) > _INFER_ROW_CAP:
        logger.warning(
            "Dataset truncated from %d to %d rows for inference (cap = %d).",
            len(X), _INFER_ROW_CAP, _INFER_ROW_CAP
        )
        X = X.iloc[:_INFER_ROW_CAP]

    logger.info("Running model.predict() on %d rows...", len(X))
    try:
        predictions = model.predict(X)
    except (ValueError, IndexError) as exc:
        n_csv   = X.shape[1]
        n_model = getattr(model, "n_features_in_", "unknown")
        expected_names = (
            list(model.feature_names_in_)
            if hasattr(model, "feature_names_in_")
            else "not available (model has no feature_names_in_ attribute)"
        )
        logger.error("model.predict() shape mismatch: CSV=%d cols, model expects=%s", n_csv, n_model)
        raise HTTPException(
            status_code=422,
            detail=(
                f"Shape mismatch: model expects {n_model} feature(s), "
                f"but your CSV provides {n_csv} feature(s) after dropping label/protected columns. "
                f"Expected feature names: {expected_names}. "
                f"Original error: {exc}"
            ),
        )

    df_copy  = df.iloc[:len(X)].copy()
    pred_col = "_fairlens_pred_"
    if pred_col in df_copy.columns:
        pred_col = f"_fairlens_pred_{uuid.uuid4().hex[:4]}_"
    df_copy[pred_col] = predictions

    logger.info("Predictions attached. Running fairness analysis...")
    try:
        results = analyze(df_copy, request.protected_col, request.label_col, pred_col)
    except Exception as exc:
        logger.exception("analyze() failed in /infer-fairness")
        raise HTTPException(
            status_code=500,
            detail=f"Fairness analysis failed after inference: {exc}",
        )

    logger.info("infer-fairness complete for file_id='%s'", request.file_id)
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


@router.post("/mitigate", tags=["fairness"], response_model=MitigateResponse)
def mitigate_file(request: MitigateRequest):
    """
    Apply AIF360 Reweighing on an uploaded dataset and return before/after metrics.
    """
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
        before_metrics = analyze(
            df, request.protected_col, request.label_col, request.predicted_col
        )

        groups    = df[request.protected_col].unique()
        pos_rates = {}
        for group in groups:
            group_df = df[df[request.protected_col] == group]
            pos_rates[group] = (group_df[request.label_col] == 1).mean() if len(group_df) > 0 else 0.0

        if len(groups) < 2:
            raise ValueError(
                f"Mitigation requires at least 2 groups in '{request.protected_col}'. "
                f"Found only: {groups.tolist()}."
            )

        privileged_group_val = max(pos_rates, key=pos_rates.get)
        unprivileged_groups  = [{request.protected_col: g} for g in groups if g != privileged_group_val]
        privileged_groups    = [{request.protected_col: privileged_group_val}]

        logger.info(
            "Privileged group: '%s', Unprivileged: %s",
            privileged_group_val,
            [g[request.protected_col] for g in unprivileged_groups]
        )

        df_copy = df.copy()

        logger.info("Building AIF360 BinaryLabelDataset...")
        try:
            dataset = BinaryLabelDataset(
                df=df_copy,
                label_names=[request.label_col],
                protected_attribute_names=[request.protected_col],
                favorable_label=1,
                unfavorable_label=0
            )
        except Exception as exc:
            raise ValueError(
                f"Failed to build AIF360 dataset: {exc}. "
                "Ensure your label column contains only 0 and 1 values, "
                "and the protected attribute column is either numeric or has exactly 2 unique values."
            )

        logger.info("Fitting and applying Reweighing transform...")
        rw = Reweighing(
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups,
        )
        dataset_transf = rw.fit_transform(dataset)

        weights      = dataset_transf.instance_weights
        weights      = np.nan_to_num(weights, nan=0.0)
        if weights.sum() == 0:
            weights = np.ones(len(weights))
        df_reweighed = df_copy.sample(
            n=len(df_copy), weights=weights, replace=True, random_state=42
        )

        logger.info("Computing AFTER metrics on reweighed dataset...")
        after_metrics = analyze(
            df_reweighed, request.protected_col, request.label_col, request.predicted_col
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
            detail=(
                f"Mitigation failed: {exc}. "
                "Common causes: non-binary label values, AIF360 installation issues on Apple Silicon, "
                "or protected column with more than 2 groups."
            ),
        )

    return MitigateResponse(
        before=before_metrics,
        after=after_metrics,
        status="complete",
    )