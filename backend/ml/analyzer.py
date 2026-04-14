import pandas as pd
<<<<<<< HEAD
import shap
import numpy as np
from sklearn.ensemble import RandomForestClassifier
=======
>>>>>>> origin/feat/arun

def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str) -> dict:
    """
    Runs fairness metrics on a dataframe.
    Returns a dict of metric_name -> score (float between 0 and 1).
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
<<<<<<< HEAD
=======
    # Measures: does the model predict positive outcomes equally across groups?
    # Score of 1.0 = perfectly fair, lower = more biased
>>>>>>> origin/feat/arun
    if max(rates) == 0:
        demographic_parity_score = 1.0
    else:
        demographic_parity_score = round(min(rates) / max(rates), 4)
    results["demographic_parity"] = demographic_parity_score

    # --- Disparate Impact ---
<<<<<<< HEAD
=======
    # Score of 0.8 or above = fair (the "80% rule")
    # Below 0.8 = biased
>>>>>>> origin/feat/arun
    di_score = round(min(rates) / max(rates), 4) if max(rates) != 0 else 1.0
    results["disparate_impact"] = di_score

    # --- Equal Opportunity ---
<<<<<<< HEAD
=======
    # Measures: among people who SHOULD get positive outcome, are all groups equally likely to get it?
>>>>>>> origin/feat/arun
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
<<<<<<< HEAD
=======
    # Measures: when model predicts positive, is it equally accurate across groups?
>>>>>>> origin/feat/arun
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
<<<<<<< HEAD
=======
    # Measures: is the positive predictive value equal across groups?
>>>>>>> origin/feat/arun
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

            # Handle all SHAP return types cleanly
            if isinstance(shap_values, list):
                shap_array = np.array(shap_values[1])
            elif hasattr(shap_values, 'values'):
                shap_array = np.array(shap_values.values)
            else:
                shap_array = np.array(shap_values)

            # If 3D array, take class 1 slice
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

    return results