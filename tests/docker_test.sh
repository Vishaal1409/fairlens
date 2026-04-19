#!/usr/bin/env bash
set -e

echo "[*] Building Docker image..."
docker build -t fairlens-backend:local .

echo "[*] Running container in background..."
CONTAINER_ID=$(docker run -d -p 8000:8000 --name fairlens-test fairlens-backend:local)

function cleanup {
  echo "[*] Cleaning up container..."
  docker stop fairlens-test >/dev/null || true
  docker rm fairlens-test >/dev/null || true
}
trap cleanup EXIT

echo "[*] Waiting 5 seconds for startup..."
sleep 5

echo "[*] Testing healthcheck endpoint via curl..."
# Curl will output HTTP status code
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$RESPONSE" -eq 200 ]; then
    echo "[✓] Healthcheck passed (HTTP $RESPONSE)!"
else
    echo "[!] FAILED: Expected HTTP 200 but got HTTP $RESPONSE"
    exit 1
fi

echo "[*] Inspecting image size..."
SIZE=$(docker image inspect fairlens-backend:local --format '{{.Size}}')
SIZE_MB=$((SIZE / 1024 / 1024))
echo "[*] Image size: $SIZE_MB MB"

echo "[*] Installing test dependencies..."
pip install -r tests/requirements-test.txt

echo "[*] Executing tests against containerized API setup..."
robot --outputdir results tests/

echo "[✓] All local docker tests passed successfully!"
