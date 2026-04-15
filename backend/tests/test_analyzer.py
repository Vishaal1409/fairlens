import pandas as pd
from analyzer import analyze

data = {
    "gender":     ["male", "female", "male", "female", "male", "female"],
    "age":        [25,     32,       45,     28,       36,     50],
    "income":     [50000,  30000,    70000,  40000,    60000,  35000],
    "experience": [2,      5,        10,     3,        8,      12],
    "label":      [1,      1,        1,      1,        0,      0],
    "prediction": [1,      1,        1,      0,        0,      1]
}

df = pd.DataFrame(data)
results = analyze(df, protected_col="gender", label_col="label", predicted_col="prediction")

for metric, score in results.items():
    print(f"{metric}: {score}")