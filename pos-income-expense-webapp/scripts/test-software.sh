#!/usr/bin/env bash
# ทดสอบซอฟต์แวร์ทั้งหมด (ไม่รวม hardware)
set -euo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
CAT_INCOME="55555555-5555-5555-5555-555555555501"
CAT_EXPENSE="55555555-5555-5555-5555-555555555505"
USER="33333333-3333-3333-3333-333333333333"
TODAY=$(date +%Y-%m-%d 2>/dev/null || echo "2026-06-08")

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

check_http() {
  local name="$1" url="$2" expect="$3"
  code=$(curl -s -o /tmp/resp.json -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then ok "$name ($code)"; else bad "$name (got $code, want $expect)"; fi
}

echo "=== Software Test @ $BASE ==="
echo ""

echo "[Pages]"
for p in /login /dashboard /income /expense /categories /reports /cash-count /settings; do
  check_http "GET $p" "$BASE$p" "200"
done

echo ""
echo "[Auth]"
code=$(curl -s -o /tmp/login.json -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" -d '{"username":"lcs","pin":"0000"}')
[ "$code" = "200" ] && ok "POST /api/auth/login" || bad "POST /api/auth/login ($code)"

echo ""
echo "[CRUD Transactions]"
CREATE=$(curl -s -X POST "$BASE/api/transactions" -H "Content-Type: application/json" -d "{
  \"type\":\"income\",\"categoryId\":\"$CAT_INCOME\",\"title\":\"soft-test income\",
  \"amount\":2500,\"paymentMethod\":\"cash\",\"transactionDate\":\"$TODAY\",\"createdBy\":\"$USER\"
}")
TXN_ID=$(python3 -c "import json; print(json.load(open('/tmp/resp.json')).get('data',{}).get('id',''))" 2>/dev/null || true)
TXN_ID=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
[ -n "$TXN_ID" ] && ok "POST transaction" || bad "POST transaction"

code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/transactions/$TXN_ID" \
  -H "Content-Type: application/json" -d "{\"title\":\"soft-test edited\",\"amount\":2600,\"categoryId\":\"$CAT_INCOME\",\"paymentMethod\":\"cash\",\"transactionDate\":\"$TODAY\"}")
[ "$code" = "200" ] && ok "PUT transaction" || bad "PUT transaction ($code)"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/transactions/$TXN_ID/void" \
  -H "Content-Type: application/json" -d '{"voidReason":"test void"}')
[ "$code" = "200" ] && ok "POST void" || bad "POST void ($code)"

# new txn for delete test
CREATE2=$(curl -s -X POST "$BASE/api/transactions" -H "Content-Type: application/json" -d "{
  \"type\":\"expense\",\"categoryId\":\"$CAT_EXPENSE\",\"title\":\"soft-test delete\",
  \"amount\":100,\"paymentMethod\":\"cash\",\"transactionDate\":\"$TODAY\"
}")
TXN2=$(echo "$CREATE2" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/transactions/$TXN2")
[ "$code" = "200" ] && ok "DELETE transaction" || bad "DELETE transaction ($code)"

echo ""
echo "[Categories]"
CCREATE=$(curl -s -X POST "$BASE/api/categories" -H "Content-Type: application/json" \
  -d '{"name":"soft-test-cat","type":"expense","color":"#ABCDEF"}')
CID=$(echo "$CCREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
[ -n "$CID" ] && ok "POST category" || bad "POST category"
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/categories/$CID")
[ "$code" = "200" ] && ok "DELETE category" || bad "DELETE category ($code)"

echo ""
echo "[Reports]"
check_http "GET summary" "$BASE/api/reports/summary" "200"
check_http "GET by-category" "$BASE/api/reports/by-category" "200"
check_http "GET dashboard" "$BASE/api/reports/dashboard" "200"
code=$(curl -s -o /tmp/export.csv -w "%{http_code}" "$BASE/api/reports/export?start=$TODAY&end=$TODAY")
[ "$code" = "200" ] && [ -s /tmp/export.csv ] && ok "GET export CSV" || bad "GET export CSV ($code)"

echo ""
echo "[Organization]"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/organizations" \
  -H "Content-Type: application/json" -d '{"name":"บัญชีร้าน"}')
[ "$code" = "200" ] && ok "PUT organization" || bad "PUT organization ($code)"

echo ""
echo "[Cash Count]"
TODAY_JSON=$(curl -s "$BASE/api/cash-counts/today")
CC_ID=$(echo "$TODAY_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data'); print(d['id'] if d else '')" 2>/dev/null || echo "")
if [ -n "$CC_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/cash-counts/$CC_ID" \
    -H "Content-Type: application/json" -d '{"actualBalance":520,"note":"soft test update"}')
  [ "$code" = "200" ] && ok "PUT cash-count (existing)" || bad "PUT cash-count ($code)"
else
  CC=$(curl -s -X POST "$BASE/api/cash-counts" -H "Content-Type: application/json" -d "{
    \"countDate\":\"$TODAY\",\"openingBalance\":500,\"actualBalance\":500,\"note\":\"soft test\"
  }")
  CC_ID=$(echo "$CC" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")
  [ -n "$CC_ID" ] && ok "POST cash-count" || bad "POST cash-count — $(echo "$CC" | head -c 200)"
fi
check_http "GET cash-counts/today" "$BASE/api/cash-counts/today" "200"

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
