import pandas as pd
from ml.analyzer import analyze

# Balanced fake dataset — both groups have positive predictions
data = {
    "gender":     ["male", "female", "male", "female", "male", "female"],
    "income":     [50000,   30000,   70000,   40000,   60000,   35000],
    "label":      [1,       1,       1,       1,       0,       0],
    "prediction": [1,       1,       1,       0,       0,       1]   # ✅ females get some 1s too
}

df = pd.DataFrame(data)
results = analyze(df, protected_col="gender", label_col="label", predicted_col="prediction")

for metric, score in results.items():
    print(f"{metric}: {score}")