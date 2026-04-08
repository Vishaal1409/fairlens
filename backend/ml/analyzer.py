import pandas as pd

def analyze(df: pd.DataFrame, protected_col: str, label_col: str, predicted_col: str) -> dict:
    """
    Runs fairness metrics on a dataframe.
    Returns a dict of metric_name -> score (float between 0 and 1).
    """
    results = {}

    # --- Demographic Parity ---
    # Measures: does the model predict positive outcomes equally across groups?
    # Score of 1.0 = perfectly fair, lower = more biased
    groups = df[protected_col].unique()
    positive_rates = {}

    for group in groups:
        group_df = df[df[protected_col] == group]
        positive_rate = (group_df[predicted_col] == 1).mean()
        positive_rates[group] = positive_rate

    rates = list(positive_rates.values())
    if max(rates) == 0:
        demographic_parity_score = 1.0
    else:
        demographic_parity_score = round(min(rates) / max(rates), 4)

    results["demographic_parity"] = demographic_parity_score

    return results