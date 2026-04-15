import pandas as pd
import shap
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str) -> dict:
    """
    Runs fairness metrics on a dataframe.
    Returns a dict of metric_name -> score (float between 0 and 1).
    Also runs AIF360 Reweighing mitigation and returns before/after scores.
    """
    results = {}

    # Auto-detect protected columns if not specified
    KNOWN_PROTECTED = ["gender", "race", "age", "religion", "nationality", "disability"]
    detected_protected = [col for col in df.columns if any(p in col.lower() for p in KNOWN_PROTECTED)]

    groups = df[protected_col].unique()
    positive_rates = {}

    for group in groups:
        group_df = df[df[protected_col] == group]
        positive_rate = (group_df[predicted_col] == 1).mean()
        positive_rates[group] = positive_rate

    rates = list(positive_rates.values())

    # --- Demographic Parity ---
    # Measures: does the model predict positive outcomes equally across groups?
    # Score of 1.0 = perfectly fair, lower = more biased
    if max(rates) == 0:
        demographic_parity_score = 1.0
    else:
        demographic_parity_score = round(min(rates) / max(rates), 4)
    results["demographic_parity"] = demographic_parity_score

    # --- Disparate Impact ---
    # Score of 0.8 or above = fair (the "80% rule")
    # Below 0.8 = biased
    di_score = round(min(rates) / max(rates), 4) if max(rates) != 0 else 1.0
    results["disparate_impact"] = di_score

    # --- Equal Opportunity ---
    # Measures: among people who SHOULD get positive outcome, are all groups equally likely to get it?
    tpr_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        actual_positive = group_df[group_df[label_col] == 1]
        if len(actual_positive) == 0:
            tpr_by_group[group] = 0.0
        else:
            tpr = (actual_positive[predicted_col] == 1).mean()
            tpr_by_group[group] = tpr

    tpr_values = list(tpr_by_group.values())
    eo_score = round(min(tpr_values) / max(tpr_values), 4) if max(tpr_values) != 0 else 1.0
    results["equal_opportunity"] = eo_score

    # --- Calibration ---
    # Measures: when model predicts positive, is it equally accurate across groups?
    calibration_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        predicted_positive = group_df[group_df[predicted_col] == 1]
        if len(predicted_positive) == 0:
            calibration_by_group[group] = 1.0
        else:
            precision = (predicted_positive[label_col] == 1).mean()
            calibration_by_group[group] = precision

    cal_values = list(calibration_by_group.values())
    cal_score = round(min(cal_values) / max(cal_values), 4) if max(cal_values) != 0 else 1.0
    results["calibration"] = cal_score

    # --- Predictive Parity ---
    # Measures: is the positive predictive value equal across groups?
    ppv_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        predicted_pos = group_df[group_df[predicted_col] == 1]
        if len(predicted_pos) == 0:
            ppv_by_group[group] = 1.0
        else:
            ppv = (predicted_pos[label_col] == 1).mean()
            ppv_by_group[group] = ppv

    ppv_values = list(ppv_by_group.values())
    pp_score = round(min(ppv_values) / max(ppv_values), 4) if max(ppv_values) != 0 else 1.0
    results["predictive_parity"] = pp_score

    # --- SHAP Feature Importance ---
    try:
        feature_cols = [
            col for col in df.columns
            if col not in [label_col, predicted_col, protected_col]
            and df[col].dtype in [np.float64, np.int64, float, int]
        ]

        if len(feature_cols) > 0:
            X = df[feature_cols].fillna(0)
            y = df[label_col]

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

            top_shap = dict(
                sorted(shap_dict.items(), key=lambda x: x[1], reverse=True)[:10]
            )
            results["shap_values"] = {k: round(float(v), 4) for k, v in top_shap.items()}
        else:
            results["shap_values"] = {}

    except Exception as e:
        results["shap_values"] = {"error": str(e)}

    # --- AIF360 Reweighing Mitigation ---
    # Applies reweighing to reduce bias, then re-runs all 5 metrics
    # Returns before/after comparison so frontend can show improvement
    try:
        # Store original scores as "before"
        before = {
            "demographic_parity": results["demographic_parity"],
            "disparate_impact": results["disparate_impact"],
            "equal_opportunity": results["equal_opportunity"],
            "calibration": results["calibration"],
            "predictive_parity": results["predictive_parity"],
        }

        # Build AIF360 dataset — needs numeric protected column
        df_aif = df.copy()

        # Convert protected column to numeric if it's categorical (e.g. male/female → 1/0)
        if not pd.api.types.is_numeric_dtype(df_aif[protected_col]):
            unique_vals = df_aif[protected_col].astype(str).unique()
            df_aif[protected_col] = df_aif[protected_col].astype(str).map(
                {unique_vals[0]: 1, unique_vals[1]: 0}
            ).astype(int)

        # AIF360 needs strictly numeric columns — drop any remaining non-numeric
        df_aif = df_aif.select_dtypes(include=[np.number])

        # Ensure key columns survived the numeric filter
        missing = [c for c in [label_col, predicted_col, protected_col] if c not in df_aif.columns]
        if missing:
            raise ValueError(f"Required columns not numeric after encoding: {missing}")

        privileged_groups = [{protected_col: 1}]
        unprivileged_groups = [{protected_col: 0}]

        aif_dataset = BinaryLabelDataset(
            df=df_aif,
            label_names=[label_col],
            protected_attribute_names=[protected_col]
        )

        # Apply Reweighing
        rw = Reweighing(
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups
        )
        rw.fit(aif_dataset)
        reweighed_dataset = rw.transform(aif_dataset)

        # Get reweighed dataframe
        df_reweighed, _ = reweighed_dataset.convert_to_dataframe()

        # Re-run metrics on reweighed data
        rw_groups = df_reweighed[protected_col].unique()
        rw_positive_rates = {}
        for group in rw_groups:
            group_df = df_reweighed[df_reweighed[protected_col] == group]
            rw_positive_rates[group] = (group_df[predicted_col] == 1).mean()

        rw_rates = list(rw_positive_rates.values())

        after_dp = round(min(rw_rates) / max(rw_rates), 4) if max(rw_rates) != 0 else 1.0
        after_di = round(min(rw_rates) / max(rw_rates), 4) if max(rw_rates) != 0 else 1.0

        rw_tpr = {}
        for group in rw_groups:
            group_df = df_reweighed[df_reweighed[protected_col] == group]
            actual_pos = group_df[group_df[label_col] == 1]
            if len(actual_pos) == 0:
                rw_tpr[group] = 0.0
            else:
                rw_tpr[group] = (actual_pos[predicted_col] == 1).mean()

        rw_tpr_vals = list(rw_tpr.values())
        after_eo = round(min(rw_tpr_vals) / max(rw_tpr_vals), 4) if max(rw_tpr_vals) != 0 else 1.0

        after = {
            "demographic_parity": after_dp,
            "disparate_impact": after_di,
            "equal_opportunity": after_eo,
            "calibration": results["calibration"],
            "predictive_parity": results["predictive_parity"],
        }

        results["mitigation"] = {
            "method": "reweighing",
            "before": before,
            "after": after
        }

    except Exception as e:
        results["mitigation"] = {"error": str(e)}

    return results