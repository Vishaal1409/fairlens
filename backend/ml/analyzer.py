import pandas as pd
import numpy as np
import shap
from sklearn.ensemble import RandomForestClassifier

from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric
from aif360.algorithms.preprocessing import Reweighing, DisparateImpactRemover


# ─────────────────────────────────────────────
# Metric Labels (from file 1)
# ─────────────────────────────────────────────
METRIC_LABELS = {
    "demographic_parity_difference": {"label": "Demographic Parity", "ideal": "0"},
    "disparate_impact_ratio": {"label": "Disparate Impact", "ideal": "1"},
    "statistical_parity_difference": {"label": "Statistical Parity", "ideal": "0"},
    "consistency_score": {"label": "Consistency", "ideal": "1"},
    "base_rate": {"label": "Base Rate", "ideal": "context"},
}


# ─────────────────────────────────────────────
# Helper: Build AIF dataset
# ─────────────────────────────────────────────
def _build_dataset(df, protected_col, label_col):
    return BinaryLabelDataset(
        df=df,
        label_names=[label_col],
        protected_attribute_names=[protected_col]
    )


# ─────────────────────────────────────────────
# AIF360 Metrics (merged)
# ─────────────────────────────────────────────
def compute_aif360_metrics(dataset, privileged_groups, unprivileged_groups):
    metric = BinaryLabelDatasetMetric(
        dataset,
        privileged_groups=privileged_groups,
        unprivileged_groups=unprivileged_groups
    )

    return {
        "demographic_parity_difference": round(float(metric.mean_difference()), 4),
        "disparate_impact_ratio": round(float(metric.disparate_impact()), 4),
        "statistical_parity_difference": round(float(metric.statistical_parity_difference()), 4),
        "consistency_score": round(float(metric.consistency()[0]), 4),
        "base_rate": round(float(metric.base_rate()), 4),
    }


# ─────────────────────────────────────────────
# MAIN ANALYZE FUNCTION
# ─────────────────────────────────────────────
def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str):

    results = {}

    # ── 1. Convert protected column if needed ─────────────────
    df_processed = df.copy()
    if not pd.api.types.is_numeric_dtype(df_processed[protected_col]):
        unique_vals = df_processed[protected_col].astype(str).unique()
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
    results["demographic_parity"] = round(min(rates)/max(rates), 4) if max(rates) else 1.0
    results["disparate_impact"] = results["demographic_parity"]

    # Equal Opportunity
    tpr = {}
    for g in groups:
        grp = df_processed[df_processed[protected_col] == g]
        actual_pos = grp[grp[label_col] == 1]
        tpr[g] = (actual_pos[predicted_col] == 1).mean() if len(actual_pos) else 0

    tpr_vals = list(tpr.values())
    results["equal_opportunity"] = round(min(tpr_vals)/max(tpr_vals), 4) if max(tpr_vals) else 1.0

    # Calibration
    ppv = {}
    for g in groups:
        grp = df_processed[df_processed[protected_col] == g]
        pred_pos = grp[grp[predicted_col] == 1]
        ppv[g] = (pred_pos[label_col] == 1).mean() if len(pred_pos) else 1.0

    ppv_vals = list(ppv.values())
    results["calibration"] = round(min(ppv_vals)/max(ppv_vals), 4) if max(ppv_vals) else 1.0
    results["predictive_parity"] = results["calibration"]

    # ── 3. SHAP Explainability ────────────────────────────────
    try:
        features = [
            c for c in df_processed.columns
            if c not in [label_col, predicted_col, protected_col]
            and df_processed[c].dtype in [int, float, np.int64, np.float64]
        ]

        if features:
            X = df_processed[features].fillna(0)
            y = df_processed[label_col]

            model = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42)
            model.fit(X, y)

            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)

            shap_array = np.array(shap_values[1] if isinstance(shap_values, list) else shap_values)
            if shap_array.ndim == 3:
                shap_array = shap_array[:, :, 1]

            importance = np.abs(shap_array).mean(axis=0)
            results["shap_values"] = dict(
                sorted(zip(features, importance), key=lambda x: x[1], reverse=True)[:10]
            )
        else:
            results["shap_values"] = {}

    except Exception as e:
        results["shap_values"] = {"error": str(e)}

    # ── 4. AIF360 Dataset ─────────────────────────────────────
    df_numeric = df_processed.select_dtypes(include=[np.number])

    privileged_groups = [{protected_col: 1}]
    unprivileged_groups = [{protected_col: 0}]

    dataset = _build_dataset(df_numeric, protected_col, label_col)

    before_aif = compute_aif360_metrics(dataset, privileged_groups, unprivileged_groups)

    # ── 5. Reweighing ─────────────────────────────────────────
    rw = Reweighing(privileged_groups=privileged_groups, unprivileged_groups=unprivileged_groups)
    rw.fit(dataset)
    rw_dataset = rw.transform(dataset)

    after_rw = compute_aif360_metrics(rw_dataset, privileged_groups, unprivileged_groups)

    # ── 6. Disparate Impact Remover ───────────────────────────
    dir_model = DisparateImpactRemover(repair_level=1.0, sensitive_attribute=protected_col)
    dir_dataset = dir_model.fit_transform(dataset)

    after_dir = compute_aif360_metrics(dir_dataset, privileged_groups, unprivileged_groups)

    # ── 7. Final Output ───────────────────────────────────────
    return {
    "protected_col": protected_col,
    "status": "complete",

    # custom metrics
    "metrics": results,

    # enriched metrics (ADD THIS)
    "metrics_enriched": {
        k: {
            "value": v,
            "label": METRIC_LABELS.get(k, {}).get("label", k),
            "explanation": METRIC_LABELS.get(k, {}).get("explanation", ""),
            "ideal": METRIC_LABELS.get(k, {}).get("ideal", "")
        }
        for k, v in before_aif.items()
    },

    # mitigation (ADD THIS STRUCTURE)
    "mitigation": {
        "reweighing": {
            "before": before_aif,
            "after": after_rw
        },
        "disparate_impact_remover": {
            "before": before_aif,
            "after": after_dir
        }
    }
}