# FairLens ⚖️

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python Version](https://img.shields.io/badge/python-3.11-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> A precision instrument for auditing machine-learning fairness. Measure bias, reason about causes with SHAP, and apply verifiable mitigation — in a single, unhurried workflow.

🌐 **Live App:** https://vishaal1409.github.io/fairlens/
🧪 **Live API:** https://fairlens-08o6.onrender.com/docs

---

## What is FairLens?

FairLens is an open-source AI Fairness Audit Platform that lets organizations upload any dataset and instantly get a comprehensive bias report with actionable fixes. No ML expertise required.

---

## Features

- **5+ Bias Metrics** — Demographic Parity, Disparate Impact, Equal Opportunity, Calibration, Predictive Parity
- **SHAP Explainability** — Understand WHY a model is biased with feature importance charts
- **AIF360 Reweighing Mitigation** — See before/after bias scores after applying fixes
- **One-click Python Export** — Copy ready-to-run mitigation code for your own environment
- **Beautiful Dashboard** — Built with React, Framer Motion, and Recharts

---

## Supported Fairness Metrics

| Metric | What it means in plain English |
|--------|-------------------------------|
| **Demographic Parity** | Does the model approve people at equal rates regardless of gender or race? |
| **Disparate Impact** | Are minority groups getting favorable outcomes at least 80% as often as majority groups? |
| **Equal Opportunity** | When someone deserves a good outcome, are all groups equally likely to receive it? |
| **Calibration** | When the model predicts positive, is it equally accurate across all groups? |
| **Predictive Parity** | Does a positive prediction mean the same thing for everyone regardless of background? |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TailwindCSS, Recharts, Framer Motion, Axios |
| **Backend** | Python 3.11, FastAPI, Uvicorn, AIF360, SHAP, scikit-learn, Pandas, NumPy |
| **Testing** | Postman |
| **DevOps** | Docker, Render (backend), GitHub Pages (frontend) |

---

## Project Structure

```text
fairlens/
├── .github/workflows/       ← GitHub Actions CI
├── backend/
│   ├── api/
│   │   └── routes.py        ← All FastAPI endpoints
│   ├── ml/
│   │   └── analyzer.py      ← Fairness metrics + SHAP + AIF360
│   ├── main.py              ← FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── src/
│   ├── components/          ← All React UI components
│   │   ├── Hero.jsx
│   │   ├── UploadSection.jsx
│   │   ├── ResultsDashboard.jsx
│   │   ├── MitigationSection.jsx
│   │   ├── MitigationCodeExport.jsx
│   │   ├── ExplainSection.jsx
│   │   ├── SHAPChart.jsx
│   │   ├── BiasHeatmap.jsx
│   │   └── ...
│   ├── App.jsx
│   ├── main.jsx
│   └── api.js               ← Axios API client
├── tests/
│   └── postman/             ← Postman collection for API testing
├── assets/                  ← Built frontend assets (GitHub Pages)
├── dist/                    ← Vite build output
├── deploy.sh                ← One-command deploy script
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Backend

```bash
# Clone the repo
git clone https://github.com/Vishaal1409/fairlens.git
cd fairlens

# Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

Server runs at **http://localhost:8000**
Swagger UI at **http://localhost:8000/docs**

### Frontend

```bash
# From repo root
npm install
npm run dev
```

---

## Docker

```bash
docker compose up --build
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload CSV, returns file_id |
| POST | `/analyze` | Run fairness metrics |
| POST | `/explain` | SHAP feature importances |
| POST | `/mitigate` | Apply AIF360 reweighing |
| POST | `/infer-fairness` | Run model predictions + fairness check |

Full contract: [API_CONTRACT.md](./API_CONTRACT.md)

---

## Testing

Backend endpoints tested via Postman collection.
Postman collection available in `tests/postman/`.

---

## Team

| Name | Role | What they built |
|------|------|----------------|
| **Vishaal** | Team Lead & Backend | ML pipeline, fairness metrics, Render deployment, SHAP integration, GitHub management |
| **Arun** | Backend & DevOps | FastAPI endpoints, Docker, API testing |
| **Shruthika** | Frontend & Data Viz | Rebuilt entire UI into the Obsidian Observatory design using React, all chart components, API wiring |
| **Ishitha** | UI/UX & Presentation | Layout design, demo video, project deck |

---

## Hackathon

Built for **Hack2Skill 2026** — Unbiased AI Decision challenge.
Submission deadline: April 24, 2026.

---

## License

MIT
