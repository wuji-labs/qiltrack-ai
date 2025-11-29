# Premium PDF 本地验证指引（g3 worktree）

> 目标：在 `D:\Projects\investor-ai-g3` 下启动本地 Supabase、跑通 `/api/report/export/pdf`，确认签名 URL、Storage、`report_documents` 等链路工作正常。

## 1. 启动本地 Supabase CLI
1. 打开 PowerShell，切到 `D:\Projects\investor-ai-g3`。
2. 运行 `npx supabase start`。
3. 完成后执行 `npx supabase status`，记录输出中的：
   - `API URL`（通常是 `http://127.0.0.1:54321`）
   - `anon key`
   - `service_role key`

> 说明：CLI 仅感知当前工作目录，所以一定要在 `investor-ai-g3` 下启动。

## 2. 配置环境变量
编辑 `D:\Projects\investor-ai-g3\.env.local`，保证以下字段与 `supabase status` 输出一致：

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<status 显示的本地 anon key>
SUPABASE_SERVICE_ROLE_KEY=<status 显示的本地 service role key>
SUPABASE_STORAGE_REPORT_BUCKET=report-assets
TEST_REPORT_TOKEN=test-token-12345
```

保存后可运行 `npm run env:check` 快速校验。

## 3. 创建 `report-assets` 私有桶
1. 浏览器打开 `http://127.0.0.1:54323/storage`（Supabase Studio）。
2. Storage → **Create new bucket**，填写：
   - Name: `report-assets`
   - Visibility: **Private**
3. 进入该桶 → Policies，依照 `docs/setup/supabase-bucket-setup-guide.md` 增加三条策略：
   - authenticated 角色可读取（SELECT）。
   - service_role 可上传（INSERT/UPDATE）。
   - service_role 可删除。

也可在 SQL Editor 里执行指南中的 SQL，一次性完成。

## 4. 安装图表依赖（仅首次）
`chartjs-node-canvas` 依赖 `node-canvas`，需要系统具备 Cairo/Pango 等原生库。

- **Windows（推荐使用 Chocolatey）**
  ```powershell
  choco install -y cairo pango libjpeg-turbo giflib
  ```
- **WSL / Linux**
  ```bash
  sudo apt update
  sudo apt install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev
  ```

装完后回到仓库执行：

```bash
npm rebuild canvas chartjs-node-canvas
```

## 5. 运行应用并生成报告
1. `npm install`（如尚未安装依赖）。
2. `npm run dev`，访问 `http://localhost:3000`。
3. 登录后在首页生成一次报告，或调用：
   ```
   curl "http://localhost:3000/api/report?symbol=AAPL&testToken=test-token-12345"
   ```
4. 记录响应中的 `reportRunId`。

## 6. 调用 PDF 导出并验证
**方式 A：** 前端点击“导出高级 PDF”按钮（要求当前用户为年费用户，见下方提示）。  
**方式 B：** 手动请求：

```bash
curl -X POST http://localhost:3000/api/report/export/pdf ^
  -H "Content-Type: application/json" ^
  -H "Cookie: sb-auth-token=...; sb-refresh-token=..." ^
  -d "{\"reportRunId\":\"<上一步的 ID>\",\"planLabel\":\"annual\"}"
```

返回 JSON 中应包含：
- `downloadUrl`: Supabase 签名 URL（若为空，`pdfBase64` 提供 fallback）。
- `duration_ms`、`chart_failures`、`storage_path` 等诊断信息。

## 7. 检查 Supabase side-effects
1. Supabase Studio → Storage → `report-assets`，应看到 `user_id/reportRunId/document.pdf`。
2. SQL Editor 执行：
   ```sql
   select report_run_id, document_type, storage_path
   from report_documents
   where document_type = 'pdf'
   order by created_at desc
   limit 5;
   ```
   确认刚生成的记录存在。

## 8. 常见问题
| 现象 | 原因 | 处理方式 |
| --- | --- | --- |
| 响应 `{ code: "plan_required" }` | Supabase `profiles` 中的 `plan`/`subscription_type` 不是 `annual` | 用 Supabase Studio 将当前用户的 `plan`/`subscription_type` 改为 `annual`，或在请求体的 `planLabel` 带 `annual`（仅临时兜底） |
| `{ code: "env_missing" }` | `.env.local` 未填 `SUPABASE_*` | 重新对照第 2 步补齐 |
| `chart_failures > 0` 或日志警告缺少 Cairo | 本机未安装 `node-canvas` 依赖 | 重复第 4 步安装原生库后执行 `npm rebuild` |
| Supabase Storage 未出现 PDF | `report-assets` 未创建或 service_role 无权限 | 第 3 步确认桶存在并重新配置策略 |

## 9. 完成后
开发验证完毕可执行：
```powershell
npx supabase stop   # 关闭本地 CLI 容器
```
并 `Ctrl+C` 停止 `npm run dev`。

> 如果需要在托管 Supabase 上执行同样流程，只需把 `.env.local` 切换成 hosted 凭证，其他步骤一致。

