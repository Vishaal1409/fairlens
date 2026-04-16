import pandas as pd
from backend.ml.analyzer import analyze 


def run_test(df, protected_col, label_col, predicted_col, title):
    print(f"\n================ {title} ================\n")

    result = analyze(
        df,
        protected_col=protected_col,
        label_col=label_col,
        predicted_col=predicted_col
    )

    # ── Mitigation results (if present) ──
    if "mitigation" in result["metrics"] and "error" not in result["metrics"]["mitigation"]:
        mitigation = result["metrics"]["mitigation"]

        print("=== BEFORE mitigation (AIF360) ===")
        for k, v in mitigation["aif360_before"].items():
            print(f"  {k}: {v}")

        print("\n=== AFTER reweighing (AIF360) ===")
        for k, v in mitigation["aif360_after"].items():
            print(f"  {k}: {v}")

    else:
        print("Mitigation failed:", result["metrics"].get("mitigation"))

    # ── Custom Metrics ──
    print("\n=== Custom Metrics ===")
    for k, v in result["metrics"].items():
        if k not in ["mitigation", "shap_values"]:
            print(f"  {k}: {v}")

    # ── SHAP ──
    print("\n=== SHAP Top Features ===")
    print(result["metrics"].get("shap_values", {}))

    print("\nStatus:", result["status"])
    print("\n========================================\n")


# ─────────────────────────────────────────
# DATASET 1: Numeric protected column
# ─────────────────────────────────────────
data1 = {
    "gender":    [1, 1, 1, 0, 0, 0, 1, 0, 1, 0],
    "age":       [25, 30, 22, 45, 50, 28, 33, 40, 27, 35],
    "income":    [1, 1, 1, 0, 0, 1, 1, 0, 1, 0],
    "predicted": [1, 1, 0, 0, 0, 1, 1, 0, 1, 0],
}
df1 = pd.DataFrame(data1)

run_test(
    df1,
    protected_col="gender",
    label_col="income",
    predicted_col="predicted",
    title="NUMERIC PROTECTED COLUMN (0/1)"
)


# ─────────────────────────────────────────
# DATASET 2: Categorical protected column
# ─────────────────────────────────────────
data2 = {
    "gender":     ["male", "female", "male", "female", "male", "female"],
    "age":        [25, 32, 45, 28, 36, 50],
    "income":     [50000, 30000, 70000, 40000, 60000, 35000],
    "experience": [2, 5, 10, 3, 8, 12],
    "label":      [1, 1, 1, 1, 0, 0],
    "prediction": [1, 1, 1, 0, 0, 1]
}
df2 = pd.DataFrame(data2)

run_test(
    df2,
    protected_col="gender",
    label_col="label",
    predicted_col="prediction",
    title="CATEGORICAL PROTECTED COLUMN (male/female)"
)