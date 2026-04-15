# FairLens — Daily Changelog

---

## 2026-04-14 (Arun)

### feat: add /mitigate endpoint with reweighing
**Commit:** `4b31811` → `feat/arun`

#### Added
- `POST /mitigate` — applies AIF360 Reweighing on an uploaded dataset to mitigate bias
  - Computes and returns fairness metrics before and after mitigation using `analyze()`
  - Automatically identifies privileged and unprivileged groups based on positive condition rates
  - Returns structured `MitigateResponse` with `before` and `after` metrics dictionaries
  - Handles missing files (404) and missing columns (422) securely

#### Changed
- `backend/requirements.txt` — added `aif360`
- Extracted and relocated test scripts to `backend/tests/` directory (`test_mitigate.py`, `test_analyzer.py`)

---

## 2026-04-13 (Arun)

### feat: /explain endpoint + model file upload + infer-fairness
**Commit:** `84e09d9` → `feat/arun`

#### Added
- `POST /explain` — SHAP feature importances for uploaded CSV + model
  - Returns top-10 features by mean absolute SHAP value
  - Async: SHAP runs in `ThreadPoolExecutor` (non-blocking event loop)
  - `shap.sample(X, 1000)` cap prevents OOM on large CSVs
  - `hasattr(model, "feature_names_in_")` guard handles non-sklearn models
  - `model_id` required (KernelExplainer surrogate deferred to v2)
  - 404 on missing file/model, 422 on column/shape mismatch, 500 on SHAP error
- `POST /infer-fairness` — runs `model.predict()` on uploaded CSV then calls `analyze()`
  - Collision-safe prediction column (`_fairlens_pred_`)
  - 100k row cap with server-side warning on truncation
  - Descriptive 422 on shape mismatch with expected feature names

#### Changed
- `POST /upload-model` response now includes `"status": "uploaded"` (additive)
- Added Pydantic response models: `ModelUploadResponse`, `ExplainRequest`,
  `ExplainResponse`, `InferFairnessRequest`, `InferFairnessResponse`
- `requirements.txt` — added `shap>=0.45.0` (installed: 0.49.1)
- `API_CONTRACT.md` — documented `/explain` and `/infer-fairness` with
  request/response shapes, error codes, and curl examples

#### Internal
- `_build_feature_matrix()` — shared helper, drops label/sensitive cols,
  aligns to `feature_names_in_` when available
- `_compute_shap()` — blocking SHAP helper, always called via `run_in_executor`

---

### chore: pull Vishaal's updated analyzer
**Commit:** `e205a92` → `feat/arun`

#### Pulled from `origin/feat/vishaal` (commit `7d81488`)
- `backend/ml/analyzer.py` — two new fairness metrics added by Vishaal:
  - `calibration` — precision equality across protected groups
  - `predictive_parity` — positive predictive value (PPV) equality
  - Auto-detection of protected columns via `KNOWN_PROTECTED` list
  - `analyze()` function signature unchanged — no routes code needed to change
- `backend/ml/test_analyzer.py` — Vishaal's manual smoke test (new file)

---

## 2026-04-10 (Arun)

### feat: model upload + health endpoint + error handling
**Commit:** `03a2061` → `feat/arun`

#### Added
- `POST /upload-model` — accepts `.pkl` / `.joblib`, stores model by `model_id`
- `GET /health` — returns `{ "status": "ok", "version": "1.0.0" }`

#### Changed
- `POST /analyze` — added column validation (422 with available column list)

---

## 2026-04-09 (Arun)

### feat: /analyze endpoint wired to ML analyzer
**Commit:** `f91815e` → `feat/arun`

#### Added
- `POST /analyze` — calls Vishaal's `analyze()` for fairness metrics
  - Validates `file_id`, `protected_col`, `label_col`, `predicted_col`
  - Returns `demographic_parity`, `disparate_impact`, `equal_opportunity`

#### Changed
- `/upload` now stores DataFrame to `uploaded_files` dict for downstream use

---

## 2026-04-08 (Arun)

### feat: initial backend setup + /upload endpoint
**Commits:** `7a20539` → `feat/arun`

#### Added
- FastAPI server (`main.py`) with CORS middleware
- `POST /upload` — accepts CSV, returns `file_id`, `columns`, `preview`, `row_count`
- `requirements.txt` — FastAPI, uvicorn, pandas, python-multipart, joblib, scikit-learn
- `startup.md` — local and Docker setup instructions
- `.gitignore` — standard Python + venv ignores
