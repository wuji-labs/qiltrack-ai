#!/bin/bash
# Direct SQL execution via Supabase REST API with Service Role Key

SUPABASE_URL="https://inmtounwqcjwsxkfnsfd.supabase.co"
SERVICE_ROLE_KEY="sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP"

echo "🔍 Checking current schema..."

# SQL 检查 report_documents 结构
INSPECT_SQL="SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='report_documents' ORDER BY ordinal_position;"

# 使用 REST API 执行查询
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_query" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$INSPECT_SQL\"}" 2>/dev/null | jq . || echo "REST API 方式失败"

echo ""
echo "使用 SQL Editor 在以下 URL 手动执行检查:"
echo "https://inmtounwqcjwsxkfnsfd.supabase.co/project/inmtounwqcjwsxkfnsfd/sql"
echo ""
echo "执行此 SQL:"
echo "$INSPECT_SQL"
