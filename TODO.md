# FairLens — Project TODO List

> Derived from `FairLens.docx`, `FairLens_PRD.docx`, `FairLens_TechDoc.docx`, and the live codebase gap analysis.  
> Legend: 🔴 High priority · 🟡 Medium priority · 🟢 Low priority

---

## 🔴 This Week (Before Apr 9 EOD — API Contract Deadline)

### Arun + Vishaal
- [ ] 🔴 Finalise and push updated `API_CONTRACT.md` using TechDoc as source of truth

### Arun — Backend / DevOps
- [ ] 🔴 Add `/api/v1/` prefix to all routes (current: `/upload`, `/analyze`)
- [ ] 🔴 Add `analysis_id` UUID session tracking across all endpoints
- [ ] 🔴 Add `GET /api/v1/health` endpoint with correct response shape
- [ ] 🔴 Add missing fields to upload response: `filename`, `detected_protected`
- [ ] 🔴 Update `requirements.txt` — add: `aif360`, `shap`, `lime`, `scikit-learn`, `scipy`

### Vishaal — ML / Metrics
- [ ] 🔴 Fix analyze request shape: rename `protected_col` → `protected_attribute`, `label_col` → `label_column`; add `positive_label` field
- [ ] 🔴 Implement 5 missing fairness metrics in `metrics.py`:
  - [ ] Predictive Parity (precision difference ≤ 0.2)
  - [ ] Equalised Odds (TPR + FPR difference ≤ 0.2)
  - [ ] Treatment Equality (FN/FP ratio comparison)
  - [ ] Individual Fairness (similar individuals treated similarly)
  - [ ] Calibration (confidence scores calibrated per group)

### Ishitha — Frontend
- [ ] 🔴 Scaffold the Vite + React frontend project in repo root (`/frontend`)

---

## 🟡 Week 2 (Apr 10–16)

### Vishaal — ML / Metrics
- [ ] 🔴 Implement `POST /api/v1/explain` endpoint (SHAP + LIME wrappers)
- [ ] 🟡 Add `explanation` text and `pass` boolean to analyze response per TechDoc spec
- [ ] 🟡 Build `detector.py` — auto-detection of protected attributes (ML-based)
- [ ] 🟡 Write unit tests for all 8 metric functions using pytest
- [ ] 🟡 Set up GitHub Actions CI (lint + test + Docker build)

### Arun — Backend / DevOps
- [ ] 🔴 Implement `POST /api/v1/mitigate` endpoint:
  - [ ] Reweighing strategy (AIF360 `Reweighing` class)
  - [ ] Disparate Impact Remover strategy (AIF360 `DisparateImpactRemover`, `repair_level=0.8`)
- [ ] 🟡 Add `.pkl` (pickle) file support to the upload endpoint
- [ ] 🟡 Replace in-memory `_file_store` dict with persistent file/session storage (`file_handler.py`)
- [ ] 🟡 Restructure backend into folders: `routers/`, `ml/`, `models/`, `utils/`
- [ ] 🟡 Add `cache.py` — SQLite result caching
- [ ] 🟡 Share Postman collection by **Apr 16**

### Shruthika — Frontend (Metric + Chart Components)
- [ ] 🔴 Build `MetricCard.jsx` — fairness metric display card
- [ ] 🔴 Build `BiasHeatmap.jsx` — 2D Recharts heatmap (metrics × demographic groups)
- [ ] 🔴 Build `fairlens.js` — Axios API client for all endpoints

### Ishitha — Frontend (Upload, Layout & Pages)
- [ ] 🔴 Build `FileUpload.jsx` — drag-and-drop CSV/pkl upload (max 50MB)
- [ ] 🔴 Build `ColumnSelector.jsx` — protected attribute + label column selection
- [ ] 🔴 Build `Sidebar.jsx`, `Header.jsx`, `ResultsPanel.jsx`
- [ ] 🔴 Build `Dashboard.jsx`, `Scorecard.jsx`, `Mitigation.jsx` pages

---

## 🟢 Week 3+

### Vishaal
- [ ] 🟡 Write pytest unit tests for all 8 metric functions
- [ ] 🟡 Set up GitHub Actions CI workflow (lint + test + Docker build)

### Shruthika
- [ ] 🟡 Build `BeforeAfterChart.jsx` — grouped bar chart showing metric delta post-mitigation
- [ ] 🟡 Build `ShapChart.jsx` — top-10 SHAP feature importance bars
- [ ] 🟡 Build `LimePanel.jsx` — LIME explanation panel

### Ishitha
- [ ] 🟡 Build `AnalysisContext` + `useAnalysis` hook (React context for shared state)
- [ ] 🟡 Build `Scorecard.jsx` + `Mitigation.jsx` pages (exportable bias scorecard)

### All Members
- [ ] 🟢 Complete manual frontend test checklist per TechDoc §6.3

---

## ⚠️ Known Risks (Do Not Ignore)

- **AIF360 on Apple Silicon (Arun & Ishitha):** Use `pip install aif360 --no-deps` then install deps manually. On Docker/Linux CI, use `aif360[all]`. Consider mocking AIF360 in local dev.
- **In-memory file store will wipe on restart:** The `/explain` and `/mitigate` endpoints require `analysis_id` persistence. Switch to temp-file or SQLite-backed session store ASAP.
- **`requirements.txt` is incomplete:** Docker image will not support ML features until `aif360`, `shap`, `lime`, `scikit-learn`, and `scipy` are added.

---

## ✅ Already Done

- [x] FastAPI server scaffolded with CORS middleware
- [x] `POST /upload` — accepts CSV, returns `file_id`, `columns`, `preview`, `row_count`
- [x] `POST /analyze` — computes 3 fairness metrics (demographic parity, disparate impact, equal opportunity)
- [x] In-memory file store (`_file_store` dict)
- [x] Docker + docker-compose configured
- [x] `startup.md` with local + Docker setup instructions
- [x] Basic `API_CONTRACT.md` stub

---

*Generated: 2026-04-09 | Sources: FairLens.docx, FairLens_PRD.docx, FairLens_TechDoc.docx, main.py, API_CONTRACT.md*
