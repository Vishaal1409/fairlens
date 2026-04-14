# FairLens — Startup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node | 18+ |
| Docker & Docker Compose | Latest stable |
| Git | Any recent version |

Install system deps on macOS:
```bash
brew install python@3.11 git node
```

---

## Option A — Local (venv)

```bash
# 1. Clone & branch
git clone https://github.com/Vishaal1409/fairlens.git
cd fairlens
git checkout feat/arun

# 2. Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the dev server (hot-reload enabled)
uvicorn main:app --reload
```

Server runs at **http://127.0.0.1:8000**

---

## Option B — Docker

```bash
# From the repo root
docker compose up --build
```

Server runs at **http://localhost:8000**

To stop:
```bash
docker compose down
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/upload` | Upload a CSV, returns metadata + preview |
| POST | `/analyze` | Run fairness metrics on an uploaded file |

Full contract: [`API_CONTRACT.md`](./API_CONTRACT.md)

### Test via Swagger UI
Open **http://127.0.0.1:8000/docs** in your browser — FastAPI auto-generates an interactive test UI.

### Test via curl
```bash
# Health check
curl http://127.0.0.1:8000/

# Upload a CSV
curl -X POST http://127.0.0.1:8000/upload \
  -F "file=@/path/to/sample.csv"
```

---

## Project Structure

```
fairlens/
├── API_CONTRACT.md
├── README.md
├── startup.md              ← you are here
├── docker-compose.yml
└── backend/
    ├── main.py             ← FastAPI application
    ├── requirements.txt
    ├── Dockerfile
    └── .dockerignore
```
