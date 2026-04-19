# FairLens — Open-source AI Fairness Audit Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python Version](https://img.shields.io/badge/python-3.11-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Robot Framework Tests](https://img.shields.io/badge/tests-passing-brightgreen)

## What is FairLens?
FairLens is an end-to-end fairness auditing platform designed to seamlessly unpack machine learning models and structurally analyze underlying bias. It enables developers and data scientists to detect discrimination rapidly, natively explain feature logic, and immediately apply mitigation fixes against protected demographic datasets.

## Key features
- **Automated Bias Detection:** Upload local datasets or live models to instantly flag underlying inequalities across protected attributes.
- **Explainability Integrations:** Compute direct feature influence out-of-the-box leveraging integrated SHAP and LIME modeling.
- **Active Bias Mitigation:** Programmatically resolve statistical disparity through immediate AIF360 Reweighing modifications mapping 'before' and 'after' scopes.
- **Actionable Visualizations:** Explore live-computation metric scorecards, dynamic heatmaps, and plain-language metric explanations across a modern React dashboard.
- **Production-Ready Security:** Hardened FastAPI infrastructure configured tightly with Docker containerization, rigorous validations, structured payloads, and automated CI workflows.

## Supported bias metrics
| Metric Name | What it measures |
|---|---|
| **Demographic Parity** | Evaluates if the probability of a positive outcome is identical across all demographic groups. |
| **Equal Opportunity** | Measures whether individuals who qualify for a positive outcome have an equal chance of receiving it regardless of demographic class. |
| **Disparate Impact** | Computes the precise ratio of favorable outcomes between unprivileged and privileged groups. |
| **Calibration** | Checks if the predicted probability of a positive outcome matches the actual observed proportion correctly. |
| **Predictive Parity** | Assesses whether the predictive precision is consistently equal among all categorized minority/majority demographic traits. |
| **Equalized Odds** | Enforces that both true positive rates and false positive rates remain identical across all separated groups. |
| **Treatment Equality** | Analyzes the comparative ratios of false negatives and false positives targeting an equilibrium of model mistakes. |
| **Disparate Impact Remover** | Pre-processes underlying data to mask disparities while maintaining foundational predictive ranking accuracy. |

## Tech stack
| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11, FastAPI, Uvicorn, AIF360, Fairlearn, SHAP, LIME, scikit-learn, Pandas, NumPy, SQLite |
| **Frontend** | React.js, Vite, TailwindCSS, Recharts, react-dropzone, axios |
| **Testing** | Robot Framework, robotframework-requests, robotframework-jsonlibrary |
| **DevOps** | GitHub Actions, Render/Railway, Docker |

## Getting started — Local setup

### Backend
1. Ensure your system meets the prerequisites: **Python 3.11**, **pip**, and **Git**.
2. Clone the repository and navigate into the main directory.
   ```bash
   git clone https://github.com/Vishaal1409/fairlens.git
   cd fairlens
   ```
3. Initialize the isolated Python virtual environment.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
4. Install all backend modules.
   ```bash
   pip install -r backend/requirements.txt
   ```
5. Ignite the backend API server locally.
   ```bash
   uvicorn backend.main:app --reload
   ```

### Frontend
1. Ensure your system meets the prerequisites: **Node.js LTS** and **npm**.
2. Navigate directly into the frontend scope.
   ```bash
   cd fairlens-frontend
   ```
3. Install the web packages natively.
   ```bash
   npm install
   ```
4. Start the Vite hot-reloading development server.
   ```bash
   npm run dev
   ```

## Running with Docker
FairLens natively supports rapid containerized infrastructure out of the box leveraging our multi-stage builds. To execute the primary API instance dynamically:
```bash
docker compose up --build
```
*Note: Make sure your Docker daemon/Desktop is active before triggering the build.*

### Mounting persistent uploads
The default `docker-compose.yml` is pre-configured to strictly map your local `./uploads/` directory to the container. Any assessment records uploaded during continuous deployment instances will survive restart wipes indefinitely.

### Overwriting environment variables
If you want to inject flags (like debugging modes), prefix the compose initiation natively:
```bash
DEBUG=false docker compose up -d
```

### Stopping instances
Halt and eject the running containers seamlessly via:
```bash
docker compose down
```

## API reference
| Method | Path | Description | Request | Response |
|---|---|---|---|---|
| **GET** | `/health` | Pings the system core dependencies mapping active framework versions. | None | JSON payload displaying statuses. |
| **POST** | `/upload` | Stashes uploaded CSV files or PKL/Joblib models indexing data securely. | `multipart/form-data` | `file_id` UUID hash and parsed JSON column metrics. |
| **POST** | `/analyze` | Extracts tracked CSV payloads testing all 8 fairness thresholds physically. | JSON strictly passing `file_id` and indexing columns. | Bias scorecard payload JSON structure. |
| **POST** | `/explain` | Injects live data instances pushing out SHAP value feature computations globally. | JSON mapping `file_id` and `model_id`. | Dictionary ranking mapped JSON values. |
| **POST** | `/mitigate` | Restructures raw datasets enforcing `AIF360 Reweighing` mitigation algorithms over the dataset traits. | JSON containing the `file_id` and structural keys. | Before/After JSON dictionary metrics. |

## Running tests
All FairLens structural QA metrics run off `Robot Framework` tests evaluating accurate endpoint structures dynamically. To test your iterations locally:
1. Load test module requirements.
   ```bash
   pip install -r tests/requirements-test.txt
   ```
2. Run backend validation suites dynamically tracking output configurations into `results/`.
   ```bash
   robot --outputdir results tests/
   ```
*Suites evaluated map file rejection caps (`bulk_large_file.robot`), foundational file assertions (`upload_validation.robot`), and precise standardized JSON schema responses logic (`error_payload_shape.robot`).*

To perform programmatic logic through graphical validation models directly, reference the formal Postman collection: `tests/postman/fairlens_postman.json`.

## Project structure
```text
fairlens/
├── .github/
│   └── workflows/
├── backend/
│   ├── api/
│   ├── ml/
│   ├── main.py
│   └── requirements.txt
├── fairlens-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── tests/
│   ├── fixtures/
│   ├── postman/
│   ├── resources/
│   └── README.md
├── docker-compose.yml
├── CHANGELOG.md
└── README.md
```

## Contributing
Contributors must create isolated branches enforcing structured naming conventions based on the requested modifications: 
`feat/yourname`

When your code satisfies operational metrics, open a Pull Request. **All PRs must be manually reviewed by Vishaal before the merge gets finalized into `main`.**

Follow strict standard commit message conventions natively:
- `feat(...)`: Added features directly matching issues.
- `fix(...)`: Bug fixes resolving active breakages.
- `docs(...)`: README, CHANGELOG, or code-block modifications.

## Team
| Name | Role | Responsibility |
|---|---|---|
| **Vishaal** | Team Lead | Backend Developer | ML pipeline scope, statistical accuracy, GitHub management |
| **Arun** | Backend Developer | Python API architecture, Server deployment configurations, Docker, Automated Testing |
| **Shruthika** | Frontend Developer | Translating endpoints into data visualizations and mapping chart components |
| **Ishitha** | Frontend Developer | UI/UX Designer | Structural layout design schemas, UI styling, formal presentation materials |

## License
MIT
