# FairLens API Contract

## POST /upload
Accepts a CSV file upload.

Request:
- Form field name: `file`
- File type: .csv

Response:
{
  "file_id": "abc123",
  "columns": ["age", "gender", "income", "loan_approved"],
  "preview": [ ...first 5 rows as list of dicts... ],
  "row_count": 1000
}

## POST /analyze
Runs bias metrics on an uploaded file.

Request (JSON body):
{
  "file_id": "abc123",
  "protected_col": "gender",
  "label_col": "loan_approved",
  "predicted_col": "prediction"
}

Response:
{
  "metrics": {
    "demographic_parity": 0.82,
    "disparate_impact": 0.74,
    "equal_opportunity": 0.91
  },
  "protected_col": "gender",
  "status": "complete"
}
