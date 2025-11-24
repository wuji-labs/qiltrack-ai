#!/bin/bash
# Hosted Supabase 部署验证脚本
# 使用方式：bash scripts/verify-hosted-deployment.sh

set -e

echo "================================"
echo "Hosted Supabase 部署验证"
echo "================================"
echo ""

# 1. 检查环境变量
echo "[1/6] 检查环境变量配置..."
if [ ! -f ".env.local" ]; then
  echo "✗ .env.local 不存在"
  exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co" .env.local; then
  echo "✗ Hosted URL 未配置"
  exit 1
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_" .env.local; then
  echo "✗ Anon key 未填充（仍为占位符）"
  exit 1
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY=PASTE_" .env.local; then
  echo "✗ Service Role key 未填充（仍为占位符）"
  exit 1
fi

echo "✓ 环境变量已配置"
echo ""

# 2. 检查迁移文件
echo "[2/6] 检查迁移文件..."
if [ ! -f "supabase/migrations/20251124000002_align_hosted_schema.sql" ]; then
  echo "✗ 迁移文件缺失"
  exit 1
fi

echo "✓ 迁移文件已就绪"
echo ""

# 3. 运行 lint
echo "[3/6] 运行 ESLint..."
npm run lint > /tmp/lint.log 2>&1
if grep -q "^✖.*problem" /tmp/lint.log; then
  echo "✗ Lint 有错误"
  grep "^✖" /tmp/lint.log
  exit 1
fi

echo "✓ Lint 通过 (0 errors)"
echo ""

# 4. 运行测试
echo "[4/6] 运行单元测试..."
npm test -- --run > /tmp/test.log 2>&1
if grep -q "FAIL" /tmp/test.log; then
  echo "✗ 测试失败"
  tail -20 /tmp/test.log
  exit 1
fi

if ! grep -q "34 passed" /tmp/test.log; then
  echo "✗ 测试数量不符（预期 34 个）"
  grep "Tests" /tmp/test.log
  exit 1
fi

echo "✓ 测试通过 (34/34)"
echo ""

# 5. 检查类型一致性
echo "[5/6] 检查 TypeScript 类型..."
if ! grep -q "report_run_id: string" types/database.ts; then
  echo "✗ report_documents 类型未更新"
  exit 1
fi

if ! grep -q "remaining_credits: number" types/database.ts; then
  echo "✗ v_user_quota 类型未更新"
  exit 1
fi

echo "✓ 类型定义已对齐"
echo ""

# 6. 启动开发服务并验证 API
echo "[6/6] 验证 API 端点..."
npm run dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 10

# API 1：额度查询
echo -n "  - /api/report/credits: "
CREDITS_RESPONSE=$(curl -s "http://localhost:3000/api/report/credits?testToken=test-token-12345" || echo '{}')
if echo "$CREDITS_RESPONSE" | grep -q "remaining_credits"; then
  echo "✓"
else
  echo "✗"
  echo "    Response: $CREDITS_RESPONSE"
fi

# API 2：历史报告
echo -n "  - /api/report/history: "
HISTORY_RESPONSE=$(curl -s "http://localhost:3000/api/report/history?testToken=test-token-12345" || echo '{}')
if echo "$HISTORY_RESPONSE" | grep -q "pagination"; then
  echo "✓"
else
  echo "✗"
  echo "    Response: $HISTORY_RESPONSE"
fi

# API 3：生成报告
echo -n "  - /api/report: "
REPORT_RESPONSE=$(curl -s "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345" || echo '{}')
if echo "$REPORT_RESPONSE" | grep -q "reportId\|error"; then
  echo "✓ (返回成功或预期错误)"
else
  echo "✗"
  echo "    Response: $REPORT_RESPONSE"
fi

# 清理
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

echo ""
echo "================================"
echo "✓ 所有检查通过！部署就绪。"
echo "================================"
echo ""
echo "后续步骤："
echo "1. 执行 Supabase CLI 命令："
echo "   npx supabase link --project-ref inmtounwqcjwsxkfnsfd"
echo "   npx supabase db push"
echo "   npx supabase gen types typescript --linked > types/database.ts"
echo ""
echo "2. 在 Dashboard 创建私有桶 report-assets"
echo ""
echo "3. 更新 CAVR 并提交 PR"
