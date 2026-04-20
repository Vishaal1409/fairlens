# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Download report button for exporting PDF/CSV summaries
- Dataset comparison view for side-by-side bias scores
- One-click mitigation code export functionality
- Demo video recording demonstrating full platform workflow
- Project presentation deck covering vision and architecture

## [1.0.0] — 2026-04-20

### Added
- **Rate Limiting (slowapi):** Added `slowapi==0.1.9` to dependencies and wired `Limiter` middleware into `main.py`. Endpoint limits: `/upload` & `/upload-model` at 20/min, `/analyze` at 60/min, `/explain` & `/infer-fairness` at 10/min, `/mitigate` at 5/min, `/health` & `/` at 100/min. Returns `429 Too Many Requests` on abuse.
- **Render Blueprint:** Created `render.yaml` Infrastructure-as-Code file for one-click Render deployment (Python 3.11, free tier, `/health` check path).
- **Demo Prep:** Created `scripts/demo_curl.sh` with annotated cURL commands exercising every endpoint and demonstrating rate-limit 429 response.

### Fixed
- **Robot Framework CI (all 44 tests):** Fixed resource import paths in all 7 `.robot` files (`tests/resources/...` → `resources/...`). Fixed multi-line `[Documentation]` continuation syntax. Added `Library String` dependency. Refactored `Generate In-Memory CSV` keyword to use `Catenate`. Replaced deprecated `[Return]` with `RETURN` across all suites.

### Changed
- Bumped API version from `0.2.0` to `1.0.0` in `main.py`
- Consolidated all test files, fixtures, datasets, and Postman collection under `tests/`
- Deployment to Render for a live public URL

## [0.2.1] — 2026-04-18

### Added
- Created `docker_test.sh` validating local container build architecture and native endpoint healthchecks
- Added `generate_fixtures.py` systematically mocking 51MB+ synthetic CSV datasets for dynamic load limit testing
- Appended `Validation & Rejection Tests` to `fairlens_postman.json` enabling programmatic strict assertion checks natively within Postman environments
- Formatted `README.md` and isolated `CHANGELOG.md` enforcing formal semantic versioning principles and operational setups

## [0.2.0] — 2026-04-17

### Added
- Created POST `/explain` endpoint returning SHAP feature contributions as JSON
- Created POST `/mitigate` endpoint applying AIF360 Reweighing and returning before/after metrics
- Created GET `/health` endpoint returning system status, version, timestamp, and dependency statuses
- Implemented 5 additional bias metrics: Calibration, Predictive Parity, Equalized Odds, Treatment Equality, and Disparate Impact Remover
- Integrated SHAP and LIME explainability frameworks into the core ML pipeline
- Added automated protected attribute detection capabilities
- Added support for `.pkl` and `.joblib` model file uploads via the `/upload` endpoint
- Implemented structured JSON error responses (error, code, message, detail fields) with specific codes
- Implemented HTTP 400, 422, 404, and 500 error handling across all backend endpoints
- Added native Python logging across the backend ML pipeline
- Implemented robust Pydantic schemas for all request and response models
- Containerized the backend using Docker with a multi-stage build, non-root user execution, and active health checks
- Added `docker-compose.yml` for simplified one-command local startup
- Added automated Robot Framework test suites (`upload_validation.robot`, `bulk_large_file.robot`, `error_payload_shape.robot`)
- Added shared test keywords mapping through `fairlens_keywords.resource`
- Added GitHub Actions CI workflow (`backend-tests.yml`) tracking pipeline integrity
- Added SHAP bar chart visualizations to the frontend dashboard
- Added BiasHeatmap component highlighting metric scores across demographic groups
- Added Before/After mitigation comparison charts to the frontend
- Added plain-language explanation panels for individual statistical metrics
- Added Bias Scorecard page featuring a Mitigation tab and "Apply Fix" button
- Added loading spinners and empty states resolving asynchronous component latency
- Distributed `fairlens_postman.json` collection bridging backend/frontend testing

## [0.1.0] — 2026-04-11

### Added
- Initialized GitHub repository and set core branch strategy (`feat/vishaal`, `feat/arun`, `feat/shruthika`, `feat/ishitha`)
- Scaffolded FastAPI backend architecture alongside Uvicorn infrastructure
- Created POST `/upload` endpoint accepting CSV payloads and returning column previews
- Created POST `/analyze` endpoint computing initial bias metrics and returning JSON formatting
- Implemented baseline bias metrics including Demographic Parity, Equal Opportunity, and Disparate Impact
- Scaffolded React frontend using Vite and TailwindCSS
- Connected React file upload component to the backend API via axios
- Implemented MetricCard components visualizing live analytical scoring

[Unreleased]: https://github.com/Vishaal1409/fairlens/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Vishaal1409/fairlens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Vishaal1409/fairlens/releases/tag/v0.1.0
