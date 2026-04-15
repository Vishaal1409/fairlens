import pandas as pd
from fastapi.testclient import TestClient
from main import app
import io

client = TestClient(app)

def test_mitigate_flow():
    # 1. Create dummy CSV
    df = pd.DataFrame({
        "age": [20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
        "gender": ["M", "F", "M", "M", "F", "F", "M", "F", "M", "F"],
        "income": [1, 0, 1, 1, 0, 0, 1, 0, 1, 0],
        "predicted_income": [1, 0, 1, 0, 0, 1, 1, 0, 1, 0]
    })
    csv_bytes = df.to_csv(index=False).encode('utf-8')
    csv_file = io.BytesIO(csv_bytes)
    
    # 2. Upload
    response = client.post("/upload", files={"file": ("test.csv", csv_file, "text/csv")})
    assert response.status_code == 200
    file_id = response.json()["file_id"]
    print("Upload successful, file_id:", file_id)
    
    # 3. Mitigate
    payload = {
        "file_id": file_id,
        "protected_col": "gender",
        "label_col": "income",
        "predicted_col": "predicted_income"
    }
    response = client.post("/mitigate", json=payload)
    if response.status_code != 200:
        print("Mitigate failed:", response.text)
    else:
        print("Mitigate successful:", response.json())

if __name__ == "__main__":
    test_mitigate_flow()
