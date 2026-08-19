#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Stock Monitor - Supabase setup =="
echo ""

if [[ -f .env ]] && grep -q 'VITE_SUPABASE_URL=https://' .env 2>/dev/null && ! grep -q 'your-project' .env; then
  echo "✓ .env 已存在且似乎已配置"
  grep 'VITE_SUPABASE' .env
  exit 0
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "请先获取 Supabase Access Token："
  echo "  1. 打开 https://supabase.com/dashboard/account/tokens"
  echo "  2. 生成新 Token（名称随意，如 stock-monitor）"
  echo "  3. 运行："
  echo ""
  echo "     SUPABASE_ACCESS_TOKEN=sbp_xxx npm run setup:supabase"
  echo ""
  exit 1
fi

PROJECT_NAME="${SUPABASE_PROJECT_NAME:-stock-monitor}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 20)}"
REGION="${SUPABASE_REGION:-ap-southeast-1}"

echo "-> Fetching organizations..."
ORGS_JSON=$(curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/organizations")
ORG_ID=$(echo "$ORGS_JSON" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  if(!Array.isArray(d)||!d.length){console.error('未找到组织，请先在 supabase.com 创建');process.exit(1)}
  console.log(d[0].id);
")

echo "-> Creating project ${PROJECT_NAME} in ${REGION}..."
CREATE_JSON=$(curl -sS -X POST \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects" \
  -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"$PROJECT_NAME\",\"db_pass\":\"$DB_PASSWORD\",\"region\":\"$REGION\"}")

PROJECT_ID=$(echo "$CREATE_JSON" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  if(!d.id){console.error(JSON.stringify(d));process.exit(1)}
  console.log(d.id);
")

echo "-> Waiting for project to become ready (1-2 min)..."
for i in $(seq 1 60); do
  STATUS_JSON=$(curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$PROJECT_ID")
  STATUS=$(echo "$STATUS_JSON" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).status||'')")
  if [[ "$STATUS" == "ACTIVE_HEALTHY" ]]; then
    echo "OK project ready"
    break
  fi
  printf "  waiting... (%s)\n" "$STATUS"
  sleep 5
done

echo "-> Fetching API keys..."
KEYS_JSON=$(curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$PROJECT_ID/api-keys")
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"
ANON_KEY=$(echo "$KEYS_JSON" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const k=(Array.isArray(d)?d:[]).find(x=>x.name==='anon'||x.name==='anon key');
  if(!k){console.error(JSON.stringify(d));process.exit(1)}
  console.log(k.api_key);
")

echo "-> Applying database schema..."
node scripts/apply-schema.mjs "$PROJECT_ID"

echo "-> Writing .env ..."
cat > .env <<EOF
# Supabase 云端同步 — 由 scripts/setup-supabase.sh 自动生成
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo ""
echo "Done!"
echo "   URL:  $SUPABASE_URL"
echo "   Project: ${PROJECT_NAME} (${PROJECT_ID})"
echo ""
echo "Next: npm run dev, then enable cloud sync in Settings"
