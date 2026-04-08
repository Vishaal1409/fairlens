# ── Stage 1: dependency install ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install deps into a separate prefix so we can copy cleanly
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Pull installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY main.py .

# Expose the port uvicorn will listen on
EXPOSE 8000

# Run with a single worker; add --workers N for production multi-process
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
