#!/usr/bin/env bash
set -e

echo "[*] Creating new tests directories..."
mkdir -p tests/postman

echo "[*] Moving test requirements..."
git mv backend/tests/requirements-test.txt tests/requirements-test.txt

echo "[*] Moving docker test script..."
git mv backend/docker_test.sh tests/docker_test.sh

echo "[*] Moving fixtures directory..."
git mv backend/tests/fixtures tests/

echo "[*] Moving resources directory..."
git mv backend/tests/resources tests/

echo "[*] Moving robot test suites..."
git mv backend/tests/upload_validation.robot tests/upload_validation.robot
git mv backend/tests/bulk_large_file.robot tests/bulk_large_file.robot
git mv backend/tests/error_payload_shape.robot tests/error_payload_shape.robot

echo "[*] Moving Python test scripts to preserve legacy..."
git mv backend/tests/*.py tests/ 2>/dev/null || true

echo "[*] Moving Postman collection..."
git mv fairlens_postman.json tests/postman/fairlens_postman.json

echo "[*] Removing empty legacy directories..."
rm -rf backend/tests/

echo "Migration complete. Remember to update path references — see TASK 2."
