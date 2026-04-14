import pytest
from fastapi.testclient import TestClient
import pandas as pd
import uuid

from main import app
from api.routes import uploaded_files

client = TestClient(app)

def test_mitigate_returns_before_after():
    # Setup mock data scenario (biased predictions)
    df = pd.DataFrame({
        "gender": [0, 0, 0, 0, 1, 1, 1, 1], # 0 is unprivileged
        "income": [0, 0, 0, 1, 1, 1, 1, 0], # income=1 is favorable
        "predicted": [0, 0, 0, 0, 1, 1, 1, 0] # predictions mostly match income, very biased against gender 0
    })
    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df

    response = client.post(
        "/mitigate",
        json={
            "file_id": file_id,
            "protected_col": "gender",
            "label_col": "income",
            "predicted_col": "predicted"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "complete"
    assert "before" in data
    assert "after" in data
    
    # We don't strictly assert the value of 'after' because we rely on AIF360, 
    # but we assert it structurally.
    assert "demographic_parity" in data["before"]
    assert "demographic_parity" in data["after"]

def test_mitigate_404():
    response = client.post(
        "/mitigate",
        json={
            "file_id": "nonexistent",
            "protected_col": "gender",
            "label_col": "income",
            "predicted_col": "predicted"
        }
    )
    assert response.status_code == 404

def test_mitigate_422_missing_col():
    df = pd.DataFrame({
        "gender": [0, 1],
        "income": [0, 1],
    })
    file_id = uuid.uuid4().hex[:8]
    uploaded_files[file_id] = df

    response = client.post(
        "/mitigate",
        json={
            "file_id": file_id,
            "protected_col": "gender",
            "label_col": "income",
            "predicted_col": "nonexistent"
        }
    )
    assert response.status_code == 422
    assert "nonexistent" in response.json()["detail"]
