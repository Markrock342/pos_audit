#!/usr/bin/env bash
# ทดสอบซอฟต์แวร์ทั้งหมด (ไม่รวม hardware)
set -uo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
CAT_INCOME="55555555-5555-5555-5555-555555555501"
CAT_EXPENSE="55555555-5555-5555-5555-555555555505"
USER="33333333-3333-3333-3333-333333333333"
TODAY=$(date +%Y-%m-%d 2>/dev/null || echo "2026-06-08")

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

json_id() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo ""
}

check_http() {
  local name="$1" url="$2" expect="$3"
  code=$(curl -s -o /tmp/resp.json -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then ok "$name ($code)"; else bad "$name (got $code, want $expect)"; fi
}

echo "=== Software Test @ $BASE ==="
echo ""

echo "[Pages]"
for p in /login /dashboard /income /income/add /expense /expense/add /categories /reports /balance /history /cash-count /settings; do
  check_http "GET $p" "$BASE$p" "200"
done

echo ""
echo "[Auth]"
code=$(curl -s -o /tmp/login.json -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" -d '{"username":"lcs","pin":"0000"}')
[ "$code" = "200" ] && ok "POST /api/auth/login" || bad "POST /api/auth/login ($code)"

echo ""
echo "[CRUD Transactions — line items]"
CREATE=$(curl -s -X POST "$BASE/api/transactions" -H "Content-Type: application/json" -d "{
  \"type\":\"income\",
  \"title\":\"soft-test income\",
  \"paymentMethod\":\"cash\",
  \"transactionDate\":\"$TODAY\",
  \"createdBy\":\"$USER\",
  \"lineItems\":[{\"title\":\"รายการทดสอบ\",\"quantity\":1,\"unitPrice\":2500,\"categoryId\":\"$CAT_INCOME\"}]
}")
TXN_ID=$(echo "$CREATE" | json_id)
if [ -n "$TXN_ID" ]; then
  ok "POST transaction (line items)"
else
  bad "POST transaction — $(echo "$CREATE" | head -c 300)"
  TXN_ID=""
fi

if [ -n "$TXN_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/transactions/$TXN_ID" \
    -H "Content-Type: application/json" -d "{
      \"title\":\"soft-test edited\",
      \"paymentMethod\":\"cash\",
      \"transactionDate\":\"$TODAY\",
      \"editReason\":\"soft test edit\",
      \"lineItems\":[{\"title\":\"รายการแก้ไข\",\"quantity\":1,\"unitPrice\":2600,\"categoryId\":\"$CAT_INCOME\"}]
    }")
  [ "$code" = "200" ] && ok "PUT transaction" || bad "PUT transaction ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/transactions/$TXN_ID/void" \
    -H "Content-Type: application/json" -d '{"voidReason":"test void"}')
  [ "$code" = "200" ] && ok "POST void" || bad "POST void ($code)"
fi

CREATE2=$(curl -s -X POST "$BASE/api/transactions" -H "Content-Type: application/json" -d "{
  \"type\":\"expense\",
  \"title\":\"soft-test void\",
  \"paymentMethod\":\"cash\",
  \"transactionDate\":\"$TODAY\",
  \"lineItems\":[{\"title\":\"ยกเลิกทดสอบ\",\"quantity\":1,\"unitPrice\":100,\"categoryId\":\"$CAT_EXPENSE\"}]
}")
TXN2=$(echo "$CREATE2" | json_id)
if [ -n "$TXN2" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/transactions/$TXN2")
  [ "$code" = "405" ] && ok "DELETE blocked (use void)" || bad "DELETE should be 405 ($code)"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/transactions/$TXN2/void" \
    -H "Content-Type: application/json" -d '{"voidReason":"soft test cleanup"}')
  [ "$code" = "200" ] && ok "POST void (cleanup)" || bad "POST void cleanup ($code)"
else
  bad "POST transaction (void test)"
fi

echo ""
echo "[Categories]"
CCREATE=$(curl -s -X POST "$BASE/api/categories" -H "Content-Type: application/json" \
  -d '{"name":"soft-test-cat","type":"expense","color":"#ABCDEF"}')
CID=$(echo "$CCREATE" | json_id)
[ -n "$CID" ] && ok "POST category" || bad "POST category"
if [ -n "$CID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/categories/$CID" \
    -H "Content-Type: application/json" -d '{"name":"soft-test-cat-edited","color":"#ABCDEF"}')
  [ "$code" = "200" ] && ok "PUT category" || bad "PUT category ($code)"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/categories/$CID")
  [ "$code" = "200" ] && ok "DELETE category" || bad "DELETE category ($code)"
fi

echo ""
echo "[Reports]"
check_http "GET summary" "$BASE/api/reports/summary" "200"
check_http "GET by-category" "$BASE/api/reports/by-category" "200"
check_http "GET dashboard" "$BASE/api/reports/dashboard" "200"
check_http "GET balance-summary" "$BASE/api/reports/balance-summary" "200"
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
  CC_ID=$(echo "$CC" | json_id)
  [ -n "$CC_ID" ] && ok "POST cash-count" || bad "POST cash-count — $(echo "$CC" | head -c 200)"
fi
check_http "GET cash-counts/today" "$BASE/api/cash-counts/today" "200"

echo ""
echo "[Audit]"
check_http "GET audit-logs" "$BASE/api/audit-logs" "200"

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
