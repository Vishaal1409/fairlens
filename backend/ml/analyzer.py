import pandas as pd
import numpy as np
import shap
import lime
import lime.lime_tabular
from sklearn.ensemble import RandomForestClassifier

from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric
from aif360.algorithms.preprocessing import Reweighing, DisparateImpactRemover


# ─────────────────────────────────────────────
# Metric Labels
# ─────────────────────────────────────────────
METRIC_LABELS = {
    "demographic_parity_difference": {"label": "Demographic Parity", "ideal": "0"},
    "disparate_impact_ratio":        {"label": "Disparate Impact",    "ideal": "1"},
    "statistical_parity_difference": {"label": "Statistical Parity",  "ideal": "0"},
    "consistency_score":             {"label": "Consistency",         "ideal": "1"},
    "base_rate":                     {"label": "Base Rate",           "ideal": "context"},
}

# Minimum rows needed to run any analysis
MIN_ROWS = 10


# ─────────────────────────────────────────────
# Helper: Validate inputs early
# ─────────────────────────────────────────────
def _validate_inputs(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str):
    """
    Raise a clear ValueError if anything is wrong before we start computing.
    Covers: missing columns, too few rows, wrong dtypes in label/predicted.
    """
    missing = [c for c in [protected_col, label_col, predicted_col] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}. Available: {df.columns.tolist()}")

    if len(df) < MIN_ROWS:
        raise ValueError(
            f"Dataset too small: {len(df)} rows. Minimum required is {MIN_ROWS} rows for reliable analysis."
        )

    for col in [label_col, predicted_col]:
        unique_vals = df[col].dropna().unique()
        if len(unique_vals) < 2:
            raise ValueError(
                f"Column '{col}' must have at least 2 unique values for fairness analysis. "
                f"Found: {unique_vals.tolist()}"
            )


# ─────────────────────────────────────────────
# Helper: Build AIF360 dataset
# ─────────────────────────────────────────────
def _build_dataset(df, protected_col, label_col):
    return BinaryLabelDataset(
        df=df,
        label_names=[label_col],
        protected_attribute_names=[protected_col]
    )


# ─────────────────────────────────────────────
# AIF360 Metrics
# ─────────────────────────────────────────────
def compute_aif360_metrics(dataset, privileged_groups, unprivileged_groups):
    metric = BinaryLabelDatasetMetric(
        dataset,
        privileged_groups=privileged_groups,
        unprivileged_groups=unprivileged_groups
    )
    return {
        "demographic_parity_difference": round(float(metric.mean_difference()), 4),
        "disparate_impact_ratio":        round(float(metric.disparate_impact()), 4),
        "statistical_parity_difference": round(float(metric.statistical_parity_difference()), 4),
        "consistency_score":             round(float(metric.consistency()[0]), 4),
        "base_rate":                     round(float(metric.base_rate()), 4),
    }


# ─────────────────────────────────────────────
# MAIN ANALYZE FUNCTION
# ─────────────────────────────────────────────
def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str):

    # ── 0. Validate inputs before doing anything ──────────────
    _validate_inputs(df, protected_col, label_col, predicted_col)

    results = {}

    # ── 1. Convert protected column if needed ─────────────────
    df_processed = df.copy()
    if not pd.api.types.is_numeric_dtype(df_processed[protected_col]):
        unique_vals = df_processed[protected_col].astype(str).unique()
        if len(unique_vals) < 2:
            raise ValueError(
                f"Protected column '{protected_col}' must have at least 2 unique groups. "
                f"Found: {unique_vals.tolist()}"
            )
        df_processed[protected_col] = df_processed[protected_col].astype(str).map(
            {unique_vals[0]: 1, unique_vals[1]: 0}
        ).astype(int)

    # ── 2. Custom Fairness Metrics ────────────────────────────
    groups = df_processed[protected_col].unique()

    positive_rates = {
        g: (df_processed[df_processed[protected_col] == g][predicted_col] == 1).mean()
        for g in groups
    }

    rates = list(positive_rates.values())
    max_rate = max(rates) if rates else 0
    results["demographic_parity"] = round(min(rates) / max_rate, 4) if max_rate else 1.0
    results["disparate_impact"]   = results["demographic_parity"]

    # Equal Opportunity
    tpr = {}
    for g in groups:
        grp        = df_processed[df_processed[protected_col] == g]
        actual_pos = grp[grp[label_col] == 1]
        tpr[g]     = (actual_pos[predicted_col] == 1).mean() if len(actual_pos) else 0.0

    tpr_vals = list(tpr.values())
    max_tpr  = max(tpr_vals) if tpr_vals else 0
    results["equal_opportunity"] = round(min(tpr_vals) / max_tpr, 4) if max_tpr else 1.0

    # Calibration / Predictive Parity
    ppv = {}
    for g in groups:
        grp      = df_processed[df_processed[protected_col] == g]
        pred_pos = grp[grp[predicted_col] == 1]
        ppv[g]   = (pred_pos[label_col] == 1).mean() if len(pred_pos) else 1.0

    ppv_vals = list(ppv.values())
    max_ppv  = max(ppv_vals) if ppv_vals else 0
    results["calibration"]       = round(min(ppv_vals) / max_ppv, 4) if max_ppv else 1.0
    results["predictive_parity"] = results["calibration"]

    # ── 3. Feature columns for ML explainers ─────────────────
    feature_cols = [
        c for c in df_processed.columns
        if c not in [label_col, predicted_col, protected_col]
        and df_processed[c].dtype in [int, float, np.int64, np.float64]
    ]

    # ── 4. SHAP Explainability ────────────────────────────────
    try:
        if len(feature_cols) == 0:
            results["shap_values"] = {}
        elif len(df_processed) < MIN_ROWS:
            results["shap_values"] = {"warning": "Too few rows for SHAP analysis."}
        else:
            X = df_processed[feature_cols].fillna(0)
            y = df_processed[label_col]

            model = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42)
            model.fit(X, y)

            explainer   = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)

            shap_array = np.array(shap_values[1] if isinstance(shap_values, list) else shap_values)
            if shap_array.ndim == 3:
                shap_array = shap_array[:, :, 1]

            importance = np.abs(shap_array).mean(axis=0)
            results["shap_values"] = dict(
                sorted(zip(feature_cols, importance.tolist()), key=lambda x: x[1], reverse=True)[:10]
            )

            # ── 5. LIME Explainability ────────────────────────
            try:
                # LIME needs at least 2 rows to sample from
                if len(X) < 2:
                    results["lime_values"] = {"warning": "Too few rows for LIME analysis."}
                else:
                    lime_explainer = lime.lime_tabular.LimeTabularExplainer(
                        training_data  = X.values,
                        feature_names  = feature_cols,
                        class_names    = ["Negative", "Positive"],
                        mode           = "classification",
                        random_state   = 42
                    )

                    # Explain the first instance as a representative example
                    instance     = X.iloc[0].values
                    explanation  = lime_explainer.explain_instance(
                        instance,
                        model.predict_proba,
                        num_features = min(10, len(feature_cols))
                    )

                    # Convert to a clean dict: feature -> weight
                    lime_dict = {feat: round(float(weight), 6) for feat, weight in explanation.as_list()}
                    results["lime_values"] = lime_dict

            except Exception as lime_err:
                results["lime_values"] = {"error": str(lime_err)}

    except Exception as e:
        results["shap_values"] = {"error": str(e)}
        results["lime_values"] = {}

    # ── 6. AIF360 Dataset ─────────────────────────────────────
    df_numeric = df_processed.select_dtypes(include=[np.number])

    privileged_groups   = [{protected_col: 1}]
    unprivileged_groups = [{protected_col: 0}]

    dataset    = _build_dataset(df_numeric, protected_col, label_col)
    before_aif = compute_aif360_metrics(dataset, privileged_groups, unprivileged_groups)

    # ── 7. Reweighing ─────────────────────────────────────────
    rw         = Reweighing(privileged_groups=privileged_groups, unprivileged_groups=unprivileged_groups)
    rw.fit(dataset)
    rw_dataset = rw.transform(dataset)
    after_rw   = compute_aif360_metrics(rw_dataset, privileged_groups, unprivileged_groups)

    # ── 8. Disparate Impact Remover ───────────────────────────
    dir_model   = DisparateImpactRemover(repair_level=1.0, sensitive_attribute=protected_col)
    dir_dataset = dir_model.fit_transform(dataset)
    after_dir   = compute_aif360_metrics(dir_dataset, privileged_groups, unprivileged_groups)

    # ── 9. Final Output ───────────────────────────────────────
    return {
        "protected_col": protected_col,
        "status":        "complete",

        # Custom metrics
        "metrics": results,

        # Enriched metrics with labels and explanations
        "metrics_enriched": {
            k: {
                "value":       v,
                "label":       METRIC_LABELS.get(k, {}).get("label", k),
                "explanation": METRIC_LABELS.get(k, {}).get("explanation", ""),
                "ideal":       METRIC_LABELS.get(k, {}).get("ideal", ""),
            }
            for k, v in before_aif.items()
        },

        # Mitigation before/after
        "mitigation": {
            "reweighing": {
                "before": before_aif,
                "after":  after_rw,
            },
            "disparate_impact_remover": {
                "before": before_aif,
                "after":  after_dir,
            },
        },
    }