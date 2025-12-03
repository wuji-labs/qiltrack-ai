# 报告生成快速排查（2025-12-03）

## 场景
- 首次生成 500 或前端报 `companyData.profile` 为空。
- Helicone 未出现调用记录，怀疑未走 LLM。

## 关键修复（已落在当前代码）
- `/api/report` 响应恢复为前端预期的 `ReportResponse` 结构，包含 `report` 文本、`companyData`、`reportRunId`。
- 复用命中时补拉最新市场数据再返回，避免 `companyData` 为空。
- generator 缺失的 `language`/`tone` 定义补回，避免 `ReferenceError`。

## 验证步骤（本地 3001）
1) `curl "http://localhost:3001/api/report?symbol=MSFT&testToken=local-test-token"` 应返回 200，JSON 中有 `companyData.profile`。
2) 重复请求可看到 `reused: true`，证明复用链路正常；首次请求应有 Helicone 记录（未命中缓存时）。

## 备注
- 复用逻辑保留，存储桶默认 `report-outputs`（兼容历史）。如需强制命中 LLM，可暂时清理缓存/复用，但请按产品设计评估。***
