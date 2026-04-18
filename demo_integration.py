"""
FairLens Integration Demo Script
Exercises the end-to-end fairness processing pipeline:
1. Generates a synthetic biased dataset and dummy trained model
2. Uploads both payload types
3. Analyzes original dataset metrics
4. Requests feature influence via SHAP explanations
5. Mitigates the dataset via AIF360 Reweighing
6. Confirms backend component health.

Usage:
    python demo_integration.py --base-url http://localhost:8000
"""

import argparse
import json
import random
import sys
import requests
import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression

def print_step(step_num, title, response, expected_success=200):
    print(f"\n{'='*50}")
    print(f"Step {step_num} -> {title}")
    print(f"{'='*50}")
    
    status = response.status_code
    print(f"Status: {status}")
    
    try:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print("Response Text:")
        print(response.text)
        data = None

    if status != expected_success:
        print(f"\n[X] FAILURE ON STEP {step_num}: Expected HTTP {expected_success}, got {status}")
        sys.exit(1)
        
    return data

def generate_synthetic_data():
    csv_file = "demo_dataset.csv"
    model_file = "demo_model.pkl"
    print(f"[*] Generating synthetic resources ({csv_file}, {model_file})...")
    
    np.random.seed(42)
    n = 300
    df = pd.DataFrame({
        "age": np.random.randint(18, 70, n),
        "income": np.random.randint(25000, 150000, n),
        "gender": np.random.choice(["Male", "Female"], n)
    })
    
    # Create artificial bias in labels
    bias_map = {"Male": 0.8, "Female": 0.2}
    probabilities = df["gender"].map(bias_map) 
    df["loan_approved"] = np.random.binomial(1, probabilities)
    
    # Train dummy logistic regression model
    X = df[["age", "income"]].copy()
    # Add one-hot encoded gender manually since we need numeric for strict prediction models
    X["gender_encoded"] = (df["gender"] == "Male").astype(int)
    
    model = LogisticRegression(random_state=42, max_iter=500)
    model.fit(X, df["loan_approved"])
    
    # Store its predictions
    df["predicted_approval"] = model.predict(X)
    
    # Save resources
    df.to_csv(csv_file, index=False)
    joblib.dump(model, model_file)
    print(f"[✓] Created dataset with {n} records.")
    
    return csv_file, model_file

def main():
    parser = argparse.ArgumentParser(description="FairLens Full Integration Demo")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    args = parser.parse_args()
    
    base_url = args.base_url.rstrip("/")
    csv_filepath, model_filepath = generate_synthetic_data()

    # STEP 1A: UPLOAD CSV ------------------------------------------------------------
    url_upload = f"{base_url}/upload"
    print(f"\n[*] POST {url_upload}")
    with open(csv_filepath, "rb") as f:
        res1a = requests.post(url_upload, files={"file": f})
    
    data_1a = print_step("1A", "POST /upload (CSV)", res1a)
    
    assert "file_id" in data_1a, "Missing file_id in response!"
    file_id = data_1a["file_id"]

    # STEP 1B: UPLOAD MODEL ----------------------------------------------------------
    url_upload_model = f"{base_url}/upload-model"
    print(f"\n[*] POST {url_upload_model}")
    with open(model_filepath, "rb") as f:
        res1b = requests.post(url_upload_model, files={"file": f})
    
    data_1b = print_step("1B", "POST /upload-model", res1b)
    
    assert "model_id" in data_1b, "Missing model_id in response!"
    model_id = data_1b["model_id"]
    
    # STEP 2: ANALYZE FAIRNESS --------------------------------------------------------
    analyze_payload = {
        "file_id": file_id,
        "protected_col": "gender",
        "label_col": "loan_approved",
        "predicted_col": "predicted_approval"
    }
    url_analyze = f"{base_url}/analyze"
    print(f"\n[*] POST {url_analyze} | Payload: {json.dumps(analyze_payload)}")
    res2 = requests.post(url_analyze, json=analyze_payload)
    
    data_2 = print_step("2", "POST /analyze", res2)
    assert "metrics" in data_2, "Missing metrics dictionary in analysis response!"

    # STEP 3: EXPLAIN (SHAP) ----------------------------------------------------------
    explain_payload = {
        "file_id": file_id,
        "model_id": model_id,
        "protected_col": "gender",
        "label_col": "loan_approved"
    }
    url_explain = f"{base_url}/explain"
    print(f"\n[*] POST {url_explain} | Payload: {json.dumps(explain_payload)}")
    res3 = requests.post(url_explain, json=explain_payload)
    
    data_3 = print_step("3", "POST /explain", res3)
    assert "shap_values" in data_3, "Missing SHAP feature importance output!"

    # STEP 4: MITIGATE BIAS -----------------------------------------------------------
    # Uses Reweighing method via AIF360
    mitigate_payload = {
        "file_id": file_id,
        "protected_col": "gender",
        "label_col": "loan_approved",
        "predicted_col": "predicted_approval"
    }
    url_mitigate = f"{base_url}/mitigate"
    print(f"\n[*] POST {url_mitigate} | Payload: {json.dumps(mitigate_payload)}")
    res4 = requests.post(url_mitigate, json=mitigate_payload)
    
    data_4 = print_step("4", "POST /mitigate", res4)
    assert "before" in data_4 and "after" in data_4, "Missing comparative metrics in mitigation response!"

    # STEP 5: SYSTEM HEALTH -----------------------------------------------------------
    url_health = f"{base_url}/health"
    print(f"\n[*] GET {url_health}")
    res5 = requests.get(url_health)
    
    # Health check can technically respond with 503 if dependencies fail to import, 
    # but for script execution integrity assuming standard 200 OK.
    data_5 = print_step("5", "GET /health", res5)
    assert data_5.get("status") in ["ok", "degraded"], "Unrecognised system health flag returned."

    print(f"\n{'='*50}")
    print("[✓] SUCCESS: All pipeline endpoints executed successfully! System functioning nominally.")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()
