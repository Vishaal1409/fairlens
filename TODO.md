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
- [ ] 🔴 Add missing fields to upload response: `filename`, `detected_protected`

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
- [ ] 🟡 Replace in-memory `_file_store` dict with persistent file/session storage (`file_handler.py`)

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

## 🟢 Week 3+ (Phase 3 Roadmap)

### Arun — Backend / DevOps
- [ ] 🟡 Expand Robot Framework testing for remaining edge-case endpoints
- [ ] 🟡 Formalize Deployment to public host (Render/Railway pipeline configs)
- [ ] 🟢 Generate final presentation deck mapping backend architecture

### Vishaal 
- [ ] 🟡 Write pytest unit tests for all 8 metric functions
- [ ] 🟡 Set up GitHub Actions CI workflow (lint + test + Docker build)

### Shruthika
- [ ] 🟡 Build `BeforeAfterChart.jsx` — grouped bar chart showing metric delta post-mitigation
- [ ] 🟡 Build `ShapChart.jsx` — top-10 SHAP feature importance bars
- [ ] 🟡 Build `LimePanel.jsx` — LIME explanation panel
- [ ] 🟡 Dataset Comparison View — display side-by-side bias score analysis
- [ ] 🟡 Code Export Feature — add one-click mitigation code export logic to UI

### Ishitha
- [ ] 🟡 Build `AnalysisContext` + `useAnalysis` hook (React context for shared state)
- [ ] 🟡 Build `Scorecard.jsx` + `Mitigation.jsx` pages (exportable bias scorecard)
- [ ] 🟡 Download Report Export — convert dashboard summaries into PDF/CSV

### All Members
- [ ] 🟢 Complete manual frontend test checklist per TechDoc §6.3

---

## ⚠️ Known Risks (Do Not Ignore)

- **AIF360 on Apple Silicon (Arun & Ishitha):** Use `pip install aif360 --no-deps` then install deps manually. On Docker/Linux CI, use `aif360[all]`. Consider mocking AIF360 in local dev.
- **In-memory file store will wipe on restart:** The `/explain` and `/mitigate` endpoints require `analysis_id` persistence. Switch to temp-file or SQLite-backed session store ASAP.
- **`requirements.txt` is incomplete:** Docker image will not support ML features until `aif360`, `shap`, `lime`, `scikit-learn`, and `scipy` are added.

---

## ✅ Already Done

- [x] **[Arun]** Added `GET /health` endpoint with active dependency statuses
- [x] **[Arun]** Upgraded `requirements.txt` locking core ML libraries correctly
- [x] **[Arun]** Implemented `POST /mitigate` mapping AIF360 Reweighing strategies natively
- [x] **[Arun]** Added `.pkl` (pickle) file support to upload validation endpoints
- [x] **[Arun]** Restructured internal tests routing moving logic natively into `./tests`
- [x] **[Arun]** Set up continuous cache integrations leveraging SQLite
- [x] **[Arun]** Validated extended Postman collections building dynamic suites
- [x] FastAPI server scaffolded with CORS middleware
- [x] `POST /upload` — accepts CSV, returns `file_id`, `columns`, `preview`, `row_count`
- [x] `POST /analyze` — computes 3 fairness metrics (demographic parity, disparate impact, equal opportunity)
- [x] In-memory file store (`_file_store` dict)
- [x] Docker + docker-compose configured
- [x] `startup.md` with local + Docker setup instructions
- [x] Basic `API_CONTRACT.md` stub

---

*Generated: 2026-04-18 | Sources: FairLens.docx, FairLens_PRD.docx, FairLens_TechDoc.docx, main.py, API_CONTRACT.md*
