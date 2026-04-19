# Stage 1 (builder): install all pip dependencies into a virtual env
FROM python:3.11-slim AS builder

WORKDIR /app

# Ensure gcc and other tools are available for building C extensions (e.g., AIF360, Numpy, scikit-learn)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements.txt first (before app code) so Docker layer caching works
COPY requirements.txt .

# pip install only reruns when requirements change
RUN pip install --no-cache-dir -r requirements.txt


# Stage 2 (runtime): copy only the venv + app code
FROM python:3.11-slim

WORKDIR /app

# Crucial glibc dependencies for ML runtime (e.g. libgomp1 for scikit-learn/LightGBM)
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*

# Run as a non-root user for security
RUN useradd -m appuser && chown -R appuser /app

# Pull only the virtual environment from Stage 1 -> no build tools in the final image
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy the actual app code
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# HEALTHCHECK instruction querying GET /health every 30s using native urllib (avoids installing curl in target)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, sys; sys.exit(0) if urllib.request.urlopen('http://localhost:8000/health').getcode() == 200 else sys.exit(1)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
