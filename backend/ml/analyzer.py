import logging
import pandas as pd
import shap
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing

# ---------------------------------------------------------------------------
# Logger — all progress and errors flow through this
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)


def _validate_columns(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str) -> None:
    """
    Raises a clear ValueError if any required column is missing from the DataFrame.
    """
    required = {
        "protected_col": protected_col,
        "label_col": label_col,
        "predicted_col": predicted_col,
    }
    missing = {name: col for name, col in required.items() if col not in df.columns}
    if missing:
        available = df.columns.tolist()
        details = ", ".join(f"'{col}' (passed as {name})" for name, col in missing.items())
        raise ValueError(
            f"Missing required columns: {details}. "
            f"Available columns in dataset: {available}"
        )


def _check_binary_labels(df: pd.DataFrame, label_col: str, predicted_col: str) -> None:
    """
    Warns if label or prediction columns contain unexpected values beyond 0/1.
    """
    for col_name, col in [("label_col", label_col), ("predicted_col", predicted_col)]:
        unique_vals = df[col].unique().tolist()
        if not set(unique_vals).issubset({0, 1}):
            logger.warning(
                "Column '%s' (%s) contains non-binary values: %s. "
                "Fairness metrics assume 0/1 encoding. Results may be unreliable.",
                col, col_name, unique_vals
            )


def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str) -> dict:
    """
    Runs fairness metrics on a DataFrame.

    Returns a dict of metric_name -> score (float between 0 and 1).
    Higher scores = fairer model.

    Also attempts:
    - SHAP feature importance (requires numeric feature columns)
    - AIF360 Reweighing mitigation (returns before/after scores)

    Args:
        df:            Input DataFrame with labels, predictions, and protected attribute.
        protected_col: Column name for the protected/sensitive attribute (e.g. 'gender').
        label_col:     Column name for the ground truth label (0 or 1).
        predicted_col: Column name for the model's predictions (0 or 1).

    Raises:
        ValueError: If required columns are missing or the DataFrame is empty.
    """
    logger.info(
        "Starting fairness analysis | rows=%d, protected='%s', label='%s', predicted='%s'",
        len(df), protected_col, label_col, predicted_col
    )

    # --- Guard: empty dataset ---
    if df.empty:
        raise ValueError(
            "The uploaded dataset is empty. "
            "Please upload a CSV with at least one row of data."
        )

    # --- Guard: missing columns ---
    _validate_columns(df, protected_col, label_col, predicted_col)

    # --- Guard: binary label check ---
    _check_binary_labels(df, label_col, predicted_col)

    results = {}

    # ---------------------------------------------------------------------------
    # Auto-detect other protected columns (informational only — logged, not used)
    # ---------------------------------------------------------------------------
    KNOWN_PROTECTED = ["gender", "race", "age", "religion", "nationality", "disability"]
    detected_protected = [
        col for col in df.columns
        if any(p in col.lower() for p in KNOWN_PROTECTED) and col != protected_col
    ]
    if detected_protected:
        logger.info(
            "Other potentially sensitive columns detected (not used in analysis): %s",
            detected_protected
        )

    # ---------------------------------------------------------------------------
    # Compute positive prediction rates per group
    # ---------------------------------------------------------------------------
    logger.info("Computing positive prediction rates per group for '%s'...", protected_col)
    groups = df[protected_col].unique()

    if len(groups) < 2:
        raise ValueError(
            f"Protected column '{protected_col}' must have at least 2 unique groups "
            f"to compute fairness metrics. Found only: {groups.tolist()}"
        )

    positive_rates = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        if len(group_df) == 0:
            logger.warning("Group '%s' in column '%s' has 0 rows — skipping.", group, protected_col)
            continue
        positive_rates[group] = (group_df[predicted_col] == 1).mean()
        logger.debug("  Group '%s': positive rate = %.4f", group, positive_rates[group])

    rates = list(positive_rates.values())

    # ---------------------------------------------------------------------------
    # Metric 1: Demographic Parity
    # ---------------------------------------------------------------------------
    logger.info("Computing Demographic Parity...")
    if max(rates) == 0:
        logger.warning(
            "All groups have a 0%% positive prediction rate. "
            "Demographic Parity is set to 1.0 but model may never predict positive outcomes."
        )
        demographic_parity_score = 1.0
    else:
        demographic_parity_score = round(min(rates) / max(rates), 4)
    results["demographic_parity"] = demographic_parity_score
    logger.info("  Demographic Parity = %.4f", demographic_parity_score)

    # ---------------------------------------------------------------------------
    # Metric 2: Disparate Impact
    # ---------------------------------------------------------------------------
    logger.info("Computing Disparate Impact...")
    di_score = round(min(rates) / max(rates), 4) if max(rates) != 0 else 1.0
    results["disparate_impact"] = di_score
    logger.info("  Disparate Impact = %.4f (threshold for fairness: >= 0.8)", di_score)
    if di_score < 0.8:
        logger.warning(
            "Disparate Impact (%.4f) is below the 80%% rule threshold. "
            "This model may be considered legally discriminatory in some jurisdictions.",
            di_score
        )

    # ---------------------------------------------------------------------------
    # Metric 3: Equal Opportunity
    # ---------------------------------------------------------------------------
    logger.info("Computing Equal Opportunity (True Positive Rate parity)...")
    tpr_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        actual_positive = group_df[group_df[label_col] == 1]
        if len(actual_positive) == 0:
            logger.warning(
                "Group '%s' has no actual positive samples in '%s'. "
                "Equal Opportunity TPR set to 0.0 for this group.",
                group, label_col
            )
            tpr_by_group[group] = 0.0
        else:
            tpr = (actual_positive[predicted_col] == 1).mean()
            tpr_by_group[group] = tpr
        logger.debug("  Group '%s': TPR = %.4f", group, tpr_by_group[group])

    tpr_values = list(tpr_by_group.values())
    eo_score = round(min(tpr_values) / max(tpr_values), 4) if max(tpr_values) != 0 else 1.0
    results["equal_opportunity"] = eo_score
    logger.info("  Equal Opportunity = %.4f", eo_score)

    # ---------------------------------------------------------------------------
    # Metric 4: Calibration (Precision equality across groups)
    # ---------------------------------------------------------------------------
    logger.info("Computing Calibration (Precision parity)...")
    calibration_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        predicted_positive = group_df[group_df[predicted_col] == 1]
        if len(predicted_positive) == 0:
            logger.warning(
                "Group '%s' has no predicted positive samples. "
                "Calibration set to 1.0 for this group (vacuously fair).",
                group
            )
            calibration_by_group[group] = 1.0
        else:
            precision = (predicted_positive[label_col] == 1).mean()
            calibration_by_group[group] = precision
        logger.debug("  Group '%s': precision = %.4f", group, calibration_by_group[group])

    cal_values = list(calibration_by_group.values())
    cal_score = round(min(cal_values) / max(cal_values), 4) if max(cal_values) != 0 else 1.0
    results["calibration"] = cal_score
    logger.info("  Calibration = %.4f", cal_score)

    # ---------------------------------------------------------------------------
    # Metric 5: Predictive Parity (PPV equality across groups)
    # ---------------------------------------------------------------------------
    logger.info("Computing Predictive Parity (PPV parity)...")
    ppv_by_group = {}
    for group in groups:
        group_df = df[df[protected_col] == group]
        predicted_pos = group_df[group_df[predicted_col] == 1]
        if len(predicted_pos) == 0:
            ppv_by_group[group] = 1.0
        else:
            ppv = (predicted_pos[label_col] == 1).mean()
            ppv_by_group[group] = ppv
        logger.debug("  Group '%s': PPV = %.4f", group, ppv_by_group[group])

    ppv_values = list(ppv_by_group.values())
    pp_score = round(min(ppv_values) / max(ppv_values), 4) if max(ppv_values) != 0 else 1.0
    results["predictive_parity"] = pp_score
    logger.info("  Predictive Parity = %.4f", pp_score)

    # ---------------------------------------------------------------------------
    # SHAP Feature Importance
    # ---------------------------------------------------------------------------
    logger.info("Starting SHAP feature importance computation...")
    try:
        feature_cols = [
            col for col in df.columns
            if col not in [label_col, predicted_col, protected_col]
            and df[col].dtype in [np.float64, np.int64, float, int]
        ]

        if len(feature_cols) == 0:
            logger.warning(
                "No numeric feature columns found after excluding '%s', '%s', '%s'. "
                "SHAP analysis skipped. Ensure your CSV has numeric feature columns.",
                label_col, predicted_col, protected_col
            )
            results["shap_values"] = {}
        else:
            logger.info("  Training surrogate RandomForest on %d features...", len(feature_cols))
            X = df[feature_cols].fillna(0)
            y = df[label_col]

            model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=4)
            model.fit(X, y)
            logger.info("  RandomForest trained. Computing SHAP values...")

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
            logger.info("  SHAP computation complete. Top feature: '%s'", next(iter(top_shap)))

    except Exception as e:
        logger.error(
            "SHAP computation failed: %s. "
            "This does not affect the fairness metrics above. "
            "Common causes: insufficient data, non-numeric features, or memory limits.",
            str(e),
            exc_info=True
        )
        results["shap_values"] = {"error": str(e)}

    # ---------------------------------------------------------------------------
    # AIF360 Reweighing Mitigation
    # ---------------------------------------------------------------------------
    logger.info("Starting AIF360 Reweighing mitigation...")
    try:
        before = {
            "demographic_parity": results["demographic_parity"],
            "disparate_impact":   results["disparate_impact"],
            "equal_opportunity":  results["equal_opportunity"],
            "calibration":        results["calibration"],
            "predictive_parity":  results["predictive_parity"],
        }

        df_aif = df.copy()

        # Encode protected column to numeric if categorical
        if not pd.api.types.is_numeric_dtype(df_aif[protected_col]):
            unique_vals = df_aif[protected_col].astype(str).unique()
            if len(unique_vals) != 2:
                raise ValueError(
                    f"AIF360 Reweighing requires exactly 2 groups in '{protected_col}'. "
                    f"Found {len(unique_vals)}: {unique_vals.tolist()}. "
                    f"Consider grouping minority groups before uploading."
                )
            logger.info(
                "  Encoding protected column '%s': '%s'→1, '%s'→0",
                protected_col, unique_vals[0], unique_vals[1]
            )
            df_aif[protected_col] = df_aif[protected_col].astype(str).map(
                {unique_vals[0]: 1, unique_vals[1]: 0}
            ).astype(int)

        df_aif = df_aif.select_dtypes(include=[np.number])

        missing_cols = [c for c in [label_col, predicted_col, protected_col] if c not in df_aif.columns]
        if missing_cols:
            raise ValueError(
                f"Columns {missing_cols} could not be kept as numeric after encoding. "
                f"Ensure label and prediction columns contain only 0/1 integer values."
            )

        privileged_groups   = [{protected_col: 1}]
        unprivileged_groups = [{protected_col: 0}]

        logger.info("  Building AIF360 BinaryLabelDataset...")
        aif_dataset = BinaryLabelDataset(
            df=df_aif,
            label_names=[label_col],
            protected_attribute_names=[protected_col]
        )

        logger.info("  Fitting Reweighing transform...")
        rw = Reweighing(
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups
        )
        rw.fit(aif_dataset)
        reweighed_dataset = rw.transform(aif_dataset)

        df_reweighed, _ = reweighed_dataset.convert_to_dataframe()
        logger.info("  Reweighing complete. Re-computing metrics on mitigated dataset...")

        rw_groups = df_reweighed[protected_col].unique()
        rw_positive_rates = {}
        for group in rw_groups:
            group_df = df_reweighed[df_reweighed[protected_col] == group]
            rw_positive_rates[group] = (group_df[predicted_col] == 1).mean()

        rw_rates = list(rw_positive_rates.values())
        after_dp = round(min(rw_rates) / max(rw_rates), 4) if max(rw_rates) != 0 else 1.0
        after_di = after_dp

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
            "disparate_impact":   after_di,
            "equal_opportunity":  after_eo,
            "calibration":        results["calibration"],
            "predictive_parity":  results["predictive_parity"],
        }

        logger.info(
            "  Mitigation summary — Demographic Parity: %.4f → %.4f | "
            "Disparate Impact: %.4f → %.4f | Equal Opportunity: %.4f → %.4f",
            before["demographic_parity"], after["demographic_parity"],
            before["disparate_impact"],   after["disparate_impact"],
            before["equal_opportunity"],  after["equal_opportunity"],
        )

        results["mitigation"] = {
            "method": "reweighing",
            "before": before,
            "after":  after,
        }

    except ValueError as e:
        logger.error("Mitigation setup failed (invalid input): %s", str(e))
        results["mitigation"] = {"error": str(e)}
    except Exception as e:
        logger.error(
            "AIF360 Reweighing failed unexpectedly: %s. "
            "Common causes on Apple Silicon: install aif360 with --no-deps and add dependencies manually.",
            str(e),
            exc_info=True
        )
        results["mitigation"] = {"error": str(e)}

    logger.info("Fairness analysis complete. Metrics computed: %s", list(results.keys()))
    return results