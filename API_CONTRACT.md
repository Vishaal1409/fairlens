# FairLens API Contract

## POST /upload
Accepts a CSV file upload.

Request:
- Form field name: `file`
- File type: `.csv`

Response:
```json
{
  "file_id": "abc123",
  "columns": ["age", "gender", "income", "loan_approved"],
  "preview": [ "...first 5 rows as list of dicts..." ],
  "row_count": 1000
}
```

curl example:
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@data.csv"
```

---

## POST /upload-model
Accepts a serialized model file (`.pkl` or `.joblib`) and stores it server-side.

Request:
- Form field name: `file`
- File type: `.pkl` or `.joblib`

Response:
```json
{
  "model_id": "a1b2c3d4",
  "status": "uploaded",
  "type": "<class 'sklearn.linear_model._logistic.LogisticRegression'>"
}
```

curl example:
```bash
curl -X POST http://localhost:8000/upload-model \
  -F "file=@model.pkl"
```

---

## POST /analyze
Runs bias metrics on an uploaded file using a pre-existing prediction column.

Request (JSON body):
```json
{
  "file_id": "abc123",
  "protected_col": "gender",
  "label_col": "loan_approved",
  "predicted_col": "prediction"
}
```

Response:
```json
{
  "metrics": {
    "demographic_parity": 0.82,
    "disparate_impact": 0.74,
    "equal_opportunity": 0.91
  },
  "protected_col": "gender",
  "status": "complete"
}
```

curl example:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"file_id":"abc123","protected_col":"gender","label_col":"loan_approved","predicted_col":"prediction"}'
```

---

## POST /explain
Computes SHAP feature importances for an uploaded CSV + model.
Returns the top-10 features by mean absolute SHAP value.

**Notes:**
- `model_id` is required (no surrogate fallback in v1).
- `predicted_col` is intentionally absent — SHAP calls `model.predict()` internally.
- SHAP computation is capped at 1,000 background rows to prevent OOM on large datasets.
- The route is non-blocking: SHAP runs in a `ThreadPoolExecutor`.

Request (JSON body):
```json
{
  "file_id": "abc123",
  "model_id": "a1b2c3d4",
  "protected_col": "gender",
  "label_col": "loan_approved"
}
```

Response:
```json
{
  "shap_values": {
    "age": 0.42,
    "income": 0.31,
    "credit_score": 0.18,
    "...": "..."
  },
  "status": "complete"
}
```

Error responses:
- `404` — `file_id` or `model_id` not found
- `422` — column not in CSV, or CSV missing model features
- `500` — SHAP computation failed (check server logs)

curl example:
```bash
# Happy path
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"file_id":"abc123","model_id":"a1b2c3d4","protected_col":"gender","label_col":"loan_approved"}'

# Bad file_id → 404
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"file_id":"bad","model_id":"a1b2c3d4","protected_col":"gender","label_col":"loan_approved"}'

# Missing column → 422
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"file_id":"abc123","model_id":"a1b2c3d4","protected_col":"nonexistent","label_col":"loan_approved"}'
```

---

## POST /infer-fairness
Loads an uploaded model, runs `predict()` on an uploaded CSV, then computes
fairness metrics via `analyze()`.

**Notes:**
- Capped at 100,000 rows; larger datasets are silently truncated with a server-side warning.
- Prediction column is generated internally as `_fairlens_pred_` (collision-safe).
- Returns a clear `422` on shape mismatch with expected feature info.

Request (JSON body):
```json
{
  "file_id": "abc123",
  "model_id": "a1b2c3d4",
  "protected_col": "gender",
  "label_col": "loan_approved"
}
```

Response:
```json
{
  "metrics": {
    "demographic_parity": 0.82,
    "disparate_impact": 0.74,
    "equal_opportunity": 0.91
  },
  "protected_col": "gender",
  "status": "complete"
}
```

Error responses:
- `404` — `file_id` or `model_id` not found
- `422` — column not in CSV, or shape mismatch between model features and CSV columns
- `500` — `analyze()` raised an unexpected error

curl example:
```bash
# Happy path
curl -X POST http://localhost:8000/infer-fairness \
  -H "Content-Type: application/json" \
  -d '{"file_id":"abc123","model_id":"a1b2c3d4","protected_col":"gender","label_col":"loan_approved"}'

# Bad model_id → 404
curl -X POST http://localhost:8000/infer-fairness \
  -H "Content-Type: application/json" \
  -d '{"file_id":"abc123","model_id":"bad","protected_col":"gender","label_col":"loan_approved"}'

# Shape mismatch → 422
# (Upload a model trained on different features than the CSV)
```
