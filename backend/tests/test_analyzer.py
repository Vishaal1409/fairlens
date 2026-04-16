import pandas as pd
from backend.ml.analyzer import analyze


def print_full_analysis(result):
    # ── Enriched Metrics ─────────────────────────
    print("\n========== ALL METRICS (WITH EXPLANATIONS) ==========")
    if "metrics_enriched" in result:
        for key, data in result["metrics_enriched"].items():
            print(f"\n  [{data['label']}]")
            print(f"  Score   : {data['value']}")
            print(f"  Ideal   : {data['ideal']}")
            print(f"  Meaning : {data['explanation']}")

    # ── Mitigation: Reweighing ───────────────────
    if "mitigation" in result and "reweighing" in result["mitigation"]:
        print("\n========== REWEIGHING — Before vs After ==========")
        before = result["mitigation"]["reweighing"]["before"]
        after  = result["mitigation"]["reweighing"]["after"]

        for k in before:
            print(f"  {k:40s}  before={before[k]:>7}  after={after[k]:>7}")

    # ── Mitigation: DIR ──────────────────────────
    if "mitigation" in result and "disparate_impact_remover" in result["mitigation"]:
        print("\n========== DISPARATE IMPACT REMOVER — Before vs After ==========")
        before = result["mitigation"]["disparate_impact_remover"]["before"]
        after  = result["mitigation"]["disparate_impact_remover"]["after"]

        for k in before:
            print(f"  {k:40s}  before={before[k]:>7}  after={after[k]:>7}")

    # ── Custom Metrics ───────────────────────────
    if "metrics" in result:
        print("\n========== CUSTOM METRICS ==========")
        for k, v in result["metrics"].items():
            print(f"  {k}: {v}")

    print("\nStatus:", result["status"])
    print("\n========================================\n")


def run_test(df, protected_col, label_col, predicted_col, title):
    print(f"\n================ {title} ================\n")

    result = analyze(
        df,
        protected_col=protected_col,
        label_col=label_col,
        predicted_col=predicted_col
    )

    print_full_analysis(result)


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


# ─────────────────────────────────────────
# OPTIONAL: Single Dataset Deep Dive
# ─────────────────────────────────────────
print("\n\n🔍 SINGLE DATASET DEEP DIVE\n")

result = analyze(
    df1,
    protected_col="gender",
    label_col="income",
    predicted_col="predicted"
)

print_full_analysis(result)