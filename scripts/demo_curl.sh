#!/usr/bin/env bash
# =============================================================================
# FairLens API — Demo cURL Script
# =============================================================================
# Usage:
#   chmod +x scripts/demo_curl.sh
#   ./scripts/demo_curl.sh [BASE_URL]
#
# Defaults to http://localhost:8000 if no URL is provided.
# =============================================================================

set -euo pipefail

BASE="${1:-http://localhost:8000}"
echo "🔗 Target: $BASE"
echo ""

# ---------------------------------------------------------------------------
# 1. Health Check
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  GET /health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -w "\nHTTP %{http_code} | %{time_total}s\n" "$BASE/health" | python3 -m json.tool 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# 2. Upload CSV
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  POST /upload  (inline CSV)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate a small test CSV on-the-fly
CSV_FILE=$(mktemp /tmp/fairlens_demo_XXXX.csv)
cat > "$CSV_FILE" <<'EOF'
age,gender,income,credit_score,label,predicted
25,1,30000,650,0,0
30,0,50000,700,1,1
35,1,45000,680,1,0
40,0,60000,720,0,1
28,1,35000,660,1,1
50,0,70000,750,1,1
22,1,25000,600,0,0
45,0,55000,710,0,0
33,1,40000,670,1,1
38,0,65000,740,1,1
EOF

UPLOAD_RESP=$(curl -s -w "\nHTTP %{http_code}" -X POST "$BASE/upload" \
  -F "file=@$CSV_FILE;filename=demo.csv")
echo "$UPLOAD_RESP" | head -n -1 | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESP"
echo ""

FILE_ID=$(echo "$UPLOAD_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['file_id'])" 2>/dev/null || echo "UNKNOWN")
echo "📌 file_id = $FILE_ID"
echo ""

# ---------------------------------------------------------------------------
# 3. Analyze
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  POST /analyze"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -w "\nHTTP %{http_code} | %{time_total}s\n" -X POST "$BASE/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"file_id\":\"$FILE_ID\",\"protected_col\":\"gender\",\"label_col\":\"label\",\"predicted_col\":\"predicted\"}" \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# 4. Mitigate
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  POST /mitigate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -w "\nHTTP %{http_code} | %{time_total}s\n" -X POST "$BASE/mitigate" \
  -H "Content-Type: application/json" \
  -d "{\"file_id\":\"$FILE_ID\",\"protected_col\":\"gender\",\"label_col\":\"label\",\"predicted_col\":\"predicted\"}" \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# 5. Error Handling — invalid file_id → 404
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  POST /analyze (invalid file_id → expect 404)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/analyze" \
  -H "Content-Type: application/json" \
  -d '{"file_id":"INVALID","protected_col":"gender","label_col":"label","predicted_col":"predicted"}' \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# 6. Error Handling — bad file type → 400
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  POST /upload (wrong file type → expect 400)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "not a csv" > /tmp/fairlens_bad.txt
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/upload" \
  -F "file=@/tmp/fairlens_bad.txt;filename=bad.txt" \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# ---------------------------------------------------------------------------
# 7. Rate Limit Test — burst 6 requests to /mitigate (limit: 5/min)
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Rate Limit Test: 6 rapid POST /mitigate → expect 429 on 6th"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in $(seq 1 6); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/mitigate" \
    -H "Content-Type: application/json" \
    -d "{\"file_id\":\"$FILE_ID\",\"protected_col\":\"gender\",\"label_col\":\"label\",\"predicted_col\":\"predicted\"}")
  echo "  Request $i → HTTP $CODE"
done
echo ""

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
rm -f "$CSV_FILE" /tmp/fairlens_bad.txt
echo "✅ Demo complete."
