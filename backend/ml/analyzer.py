import pandas as pd
import numpy as np
import shap
from sklearn.ensemble import RandomForestClassifier

from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric
from aif360.algorithms.preprocessing import Reweighing


# ─────────────────────────────────────────────────────────────
# AIF360 METRICS (from your first code)
# ─────────────────────────────────────────────────────────────
def compute_aif360_metrics(dataset, privileged_groups, unprivileged_groups):
    metric = BinaryLabelDatasetMetric(
        dataset,
        privileged_groups=privileged_groups,
        unprivileged_groups=unprivileged_groups
    )
    return {
        "demographic_parity": round(float(metric.mean_difference()), 4),
        "disparate_impact": round(float(metric.disparate_impact()), 4),
        "statistical_parity_difference": round(float(metric.statistical_parity_difference()), 4),
        "consistency": round(float(metric.consistency()[0]), 4),
        "base_rate": round(float(metric.base_rate()), 4),
    }


# ─────────────────────────────────────────────────────────────
# MAIN ANALYZE FUNCTION (merged)
# ─────────────────────────────────────────────────────────────
def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str):

    results = {}

    # ── Ensure protected column is numeric ────────────────────
    df_processed = df.copy()
    if not pd.api.types.is_numeric_dtype(df_processed[protected_col]):
        unique_vals = df_processed[protected_col].astype(str).unique()
        df_processed[protected_col] = df_processed[protected_col].astype(str).map(
            {unique_vals[0]: 1, unique_vals[1]: 0}
        ).astype(int)

    # ── BASIC GROUP CALCULATIONS ──────────────────────────────
    groups = df_processed[protected_col].unique()

    # Positive rates
    positive_rates = {}
    for group in groups:
        group_df = df_processed[df_processed[protected_col] == group]
        positive_rates[group] = (group_df[predicted_col] == 1).mean()

    rates = list(positive_rates.values())

    # ── CUSTOM FAIRNESS METRICS ───────────────────────────────
    results["demographic_parity"] = round(min(rates) / max(rates), 4) if max(rates) != 0 else 1.0
    results["disparate_impact"] = results["demographic_parity"]

    # Equal Opportunity
    tpr_by_group = {}
    for group in groups:
        group_df = df_processed[df_processed[protected_col] == group]
        actual_positive = group_df[group_df[label_col] == 1]
        tpr_by_group[group] = (
            (actual_positive[predicted_col] == 1).mean()
            if len(actual_positive) > 0 else 0.0
        )

    tpr_vals = list(tpr_by_group.values())
    results["equal_opportunity"] = round(min(tpr_vals) / max(tpr_vals), 4) if max(tpr_vals) != 0 else 1.0

    # Calibration / Predictive Parity
    ppv_by_group = {}
    for group in groups:
        group_df = df_processed[df_processed[protected_col] == group]
        pred_pos = group_df[group_df[predicted_col] == 1]
        ppv_by_group[group] = (
            (pred_pos[label_col] == 1).mean()
            if len(pred_pos) > 0 else 1.0
        )

    ppv_vals = list(ppv_by_group.values())
    results["calibration"] = round(min(ppv_vals) / max(ppv_vals), 4) if max(ppv_vals) != 0 else 1.0
    results["predictive_parity"] = results["calibration"]

    # ── SHAP EXPLAINABILITY ───────────────────────────────────
    try:
        feature_cols = [
            col for col in df_processed.columns
            if col not in [label_col, predicted_col, protected_col]
            and df_processed[col].dtype in [np.float64, np.int64, float, int]
        ]

        if feature_cols:
            X = df_processed[feature_cols].fillna(0)
            y = df_processed[label_col]

            model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=4)
            model.fit(X, y)

            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)

            if isinstance(shap_values, list):
                shap_array = np.array(shap_values[1])
            elif hasattr(shap_values, 'values'):
                shap_array = np.array(shap_values.values)
            else:
                shap_array = np.array(shap_values)

            if shap_array.ndim == 3:
                shap_array = shap_array[:, :, 1]

            mean_shap = np.abs(shap_array).mean(axis=0)
            shap_dict = dict(zip(feature_cols, mean_shap.tolist()))

            results["shap_values"] = {
                k: round(float(v), 4)
                for k, v in sorted(shap_dict.items(), key=lambda x: x[1], reverse=True)[:10]
            }
        else:
            results["shap_values"] = {}

    except Exception as e:
        results["shap_values"] = {"error": str(e)}

    # ── AIF360 DATASET ────────────────────────────────────────
    df_numeric = df_processed.select_dtypes(include=[np.number])

    privileged_groups = [{protected_col: 1}]
    unprivileged_groups = [{protected_col: 0}]

    aif_dataset = BinaryLabelDataset(
        df=df_numeric,
        label_names=[label_col],
        protected_attribute_names=[protected_col]
    )

    # ── AIF360 BEFORE METRICS ─────────────────────────────────
    aif_before = compute_aif360_metrics(
        aif_dataset, privileged_groups, unprivileged_groups
    )

    # ── REWEIGHING MITIGATION ─────────────────────────────────
    try:
        rw = Reweighing(
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups
        )

        rw.fit(aif_dataset)
        rw_dataset = rw.transform(aif_dataset)

        # AIF360 AFTER metrics
        aif_after = compute_aif360_metrics(
            rw_dataset, privileged_groups, unprivileged_groups
        )

        results["mitigation"] = {
            "method": "reweighing",
            "custom_metrics_before": {
                k: results[k] for k in [
                    "demographic_parity",
                    "disparate_impact",
                    "equal_opportunity",
                    "calibration",
                    "predictive_parity"
                ]
            },
            "aif360_before": aif_before,
            "aif360_after": aif_after
        }

    except Exception as e:
        results["mitigation"] = {"error": str(e)}

    return {
        "protected_col": protected_col,
        "status": "complete",
        "metrics": results
    }