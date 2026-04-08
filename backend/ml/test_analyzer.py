import pandas as pd
from analyzer import analyze

# Fake dataset
data = {
    "gender": ["male", "female", "male", "female", "male", "female"],
    "income":  [50000,  30000,   70000,  40000,   60000,  35000],
    "label":   [1,      0,       1,      1,       1,      0],
    "prediction": [1,   0,       1,      0,       1,      0]
}

df = pd.DataFrame(data)
results = analyze(df, protected_col="gender", label_col="label", predicted_col="prediction")
print("Results:", results)